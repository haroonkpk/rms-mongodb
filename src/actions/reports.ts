"use server";

import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  ReportData,
  ReportFilters,
  ReportTab,
  TrendPoint,
  TrendChartPoint,
  TrendSeries,
  BreakdownPoint,
} from "@/types/reports";

function rangeFor(filters: ReportFilters) {
  const now = new Date();
  if (filters.period === "CUSTOM" && filters.startDate && filters.endDate) {
    return {
      start: new Date(`${filters.startDate}T00:00:00.000Z`),
      end: new Date(`${filters.endDate}T23:59:59.999Z`),
    };
  }
  if (filters.period === "TODAY") {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
  if (filters.period === "THIS_WEEK") {
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - now.getUTCDay(),
      ),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end };
  }
  const start =
    filters.period === "THIS_MONTH"
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 30,
          ),
        );
  return { start, end: new Date() };
}

const number = (value: unknown) => Number(value ?? 0);
const trendColors = [
  "#2563EB",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#DB2777",
  "#84CC16",
  "#F97316",
  "#14B8A6",
  "#7C3AED",
  "#E11D48",
];
const getTrendColor = (index: number) =>
  index < trendColors.length
    ? trendColors[index]
    : `hsl(${(index * 137.508) % 360} 68% 45%)`;
const trend = (rows: Array<{ date: Date; amount: number }>): TrendPoint[] => {
  const map = new Map<string, TrendPoint>();
  rows.forEach(({ date, amount }) => {
    const label = date.toISOString().slice(0, 10);
    const item = map.get(label) ?? { label, amount: 0, count: 0 };
    item.amount += amount;
    item.count += 1;
    map.set(label, item);
  });
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
};

function breakdown(map: Map<string, BreakdownPoint>) {
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export async function getReportData(
  tab: ReportTab,
  filters: ReportFilters,
): Promise<ReportData> {
  await requireAdmin();
  const { start, end } = rangeFor(filters);
  if (tab === "profit-loss") {
    const [orders, expenses, stockMovements] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, status: "COMPLETED" },
        select: { totalAmount: true, createdAt: true },
      }),
      prisma.expense.findMany({
        where: { expenseDate: { gte: start, lte: end } },
        select: { expenseType: true, amount: true, expenseDate: true },
      }),
      prisma.stockMovement.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          type: {
            in: ["WASTAGE_OUT", "SPOILAGE_OUT"] as never,
          },
        },
        include: { inventoryItem: { select: { unitCost: true } } },
      }),
    ]);
    const revenue = orders.reduce(
      (sum, order) => sum + number(order.totalAmount),
      0,
    );
    const salaryExpenses = expenses
      .filter((expense) => expense.expenseType.toLowerCase() === "salaries")
      .reduce((sum, expense) => sum + number(expense.amount), 0);
    const otherExpenses = expenses
      .filter((expense) => expense.expenseType.toLowerCase() !== "salaries")
      .reduce((sum, expense) => sum + number(expense.amount), 0);
    const inventoryUsedCost = stockMovements.reduce(
      (sum, movement) =>
        sum +
        Math.abs(number(movement.quantityChange)) *
          number(movement.inventoryItem.unitCost),
      0,
    );
    const totalExpenses = salaryExpenses + otherExpenses;
    const totalCosts = totalExpenses + inventoryUsedCost;
    const operatingResult = revenue - totalCosts;
    const lines: BreakdownPoint[] = [
      { label: "Revenue", amount: revenue, count: orders.length },
      {
        label: "Salaries",
        amount: salaryExpenses,
        count: expenses.filter(
          (expense) => expense.expenseType.toLowerCase() === "salaries",
        ).length,
      },
      {
        label: "Other Expenses",
        amount: otherExpenses,
        count: expenses.filter(
          (expense) => expense.expenseType.toLowerCase() !== "salaries",
        ).length,
      },
      {
        label: "Inventory Used / Lost",
        amount: inventoryUsedCost,
        count: stockMovements.length,
      },
      { label: "Operating Result", amount: operatingResult, count: 1 },
    ];
    const profit = Math.max(operatingResult, 0);
    const loss = Math.max(-operatingResult, 0);
    const dailyResults = new Map<string, { revenue: number; costs: number }>();
    const dailyResult = (date: Date) => {
      const label = date.toISOString().slice(0, 10);
      const result = dailyResults.get(label) ?? { revenue: 0, costs: 0 };
      dailyResults.set(label, result);
      return result;
    };
    orders.forEach((order) => {
      dailyResult(order.createdAt).revenue += number(order.totalAmount);
    });
    expenses.forEach((expense) => {
      dailyResult(expense.expenseDate).costs += number(expense.amount);
    });
    stockMovements.forEach((movement) => {
      dailyResult(movement.createdAt).costs +=
        Math.abs(number(movement.quantityChange)) *
        number(movement.inventoryItem.unitCost);
    });
    const profitLossTrendData: TrendChartPoint[] = [...dailyResults.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([label, result]) => {
        const net = result.revenue - result.costs;
        return {
          label,
          profit: Math.max(net, 0),
          loss: Math.max(-net, 0),
        };
      });
    return {
      tab,
      range: { start: start.toISOString(), end: end.toISOString() },
      kpis: [
        { label: "Revenue", value: revenue },
        { label: "Total costs", value: totalCosts },
        { label: "Profit", value: profit },
        { label: "Loss", value: loss },
      ],
      trend: trend(
        orders.map((order) => ({
          date: order.createdAt,
          amount: number(order.totalAmount),
        })),
      ),
      trendSeries: {
        data: profitLossTrendData,
        series: [
          { key: "profit", label: "Profit", color: "#16A34A" },
          { key: "loss", label: "Loss", color: "#DC2626" },
        ],
      },
      breakdown: lines.filter((line) => line.label !== "Operating Result"),
      rows: lines.map((line) => ({
        line: line.label,
        amount: line.amount,
        entries: line.count,
      })),
    };
  }
  if (tab === "sales" || tab === "menu" || tab === "operations") {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(filters.cashierId ? { cashierId: filters.cashierId } : {}),
        ...(filters.paymentMethod && filters.paymentMethod !== "ALL"
          ? { paymentMethod: filters.paymentMethod as never }
          : {}),
        ...(tab !== "sales" &&
        tab !== "menu" &&
        filters.orderStatus &&
        filters.orderStatus !== "ALL"
          ? { status: filters.orderStatus as never }
          : tab === "sales" || tab === "menu"
            ? { status: "COMPLETED" }
            : {}),
      },
      include: { items: true, cashier: { select: { fullName: true } } },
    });
    const completed = orders.filter((order) => order.status === "COMPLETED");
    const sales = completed.reduce(
      (sum, order) => sum + number(order.totalAmount),
      0,
    );
    const paymentMap = new Map<string, BreakdownPoint>();
    completed.forEach((order) => {
      const item = paymentMap.get(order.paymentMethod) ?? {
        label: order.paymentMethod,
        amount: 0,
        count: 0,
      };
      item.amount += number(order.totalAmount);
      item.count += 1;
      paymentMap.set(order.paymentMethod, item);
    });
    if (tab === "menu") {
      const items = new Map<string, BreakdownPoint>();
      completed
        .flatMap((order) => order.items)
        .forEach((item) => {
          const row = items.get(item.itemName) ?? {
            label: item.itemName,
            amount: 0,
            count: 0,
          };
          row.amount += number(item.totalPrice);
          row.count += item.quantity;
          items.set(item.itemName, row);
        });
      const menuSeries: TrendSeries[] = [...items.values()].map(
        (item, index) => ({
          key: `item_${index}`,
          label: item.label,
          color: getTrendColor(index),
        }),
      );
      const itemSeriesKeys = new Map(
        menuSeries.map((series) => [series.label, series.key]),
      );
      const menuTrendMap = new Map<string, TrendChartPoint>();
      completed.forEach((order) => {
        const label = order.createdAt.toISOString().slice(0, 10);
        const point = menuTrendMap.get(label) ?? { label };
        order.items.forEach((item) => {
          const key = itemSeriesKeys.get(item.itemName);
          if (key) point[key] = Number(point[key] ?? 0) + item.quantity;
        });
        menuTrendMap.set(label, point);
      });
      return {
        tab,
        range: { start: start.toISOString(), end: end.toISOString() },
        kpis: [
          {
            label: "Items sold",
            value: [...items.values()].reduce(
              (sum, item) => sum + item.count,
              0,
            ),
          },
        ],
        trend: trend(
          completed.flatMap((order) =>
            order.items.map((item) => ({
              date: order.createdAt,
              amount: item.quantity,
            })),
          ),
        ),
        trendSeries: {
          data: [...menuTrendMap.values()].sort((a, b) =>
            a.label.localeCompare(b.label),
          ),
          series: menuSeries,
        },
        breakdown: breakdown(items),
        rows: breakdown(items).map((item) => ({
          item: item.label,
          quantity: item.count,
          revenue: item.amount,
        })),
      };
    }
    if (tab === "operations") {
      const statuses = new Map<string, BreakdownPoint>();
      orders.forEach((order) => {
        const row = statuses.get(order.status) ?? {
          label: order.status,
          amount: 0,
          count: 0,
        };
        row.amount += number(order.totalAmount);
        row.count += 1;
        statuses.set(order.status, row);
      });
      return {
        tab,
        range: { start: start.toISOString(), end: end.toISOString() },
        kpis: [
          { label: "Total orders", value: orders.length },
          { label: "Completed", value: completed.length },
          {
            label: "Active queue",
            value: orders.filter((order) =>
              ["PENDING", "PREPARING", "READY"].includes(order.status),
            ).length,
          },
        ],
        trend: trend(
          orders.map((order) => ({
            date: order.createdAt,
            amount: number(order.totalAmount),
          })),
        ),
        breakdown: breakdown(statuses),
        rows: breakdown(statuses).map((item) => ({
          status: item.label,
          orders: item.count,
          amount: item.amount,
        })),
      };
    }
    const cashierMap = new Map<string, BreakdownPoint>();
    completed.forEach((order) => {
      const label = order.cashier?.fullName ?? "Unassigned";
      const row = cashierMap.get(label) ?? { label, amount: 0, count: 0 };
      row.amount += number(order.totalAmount);
      row.count += 1;
      cashierMap.set(label, row);
    });
    return {
      tab,
      range: { start: start.toISOString(), end: end.toISOString() },
      kpis: [
        { label: "Sales", value: sales },
        { label: "Orders", value: completed.length },
        {
          label: "Outstanding orders",
          value: orders.filter((order) => order.paymentStatus === "UNPAID")
            .length,
        },
        {
          label: "Ledgers outstanding",
          value: orders
            .filter((order) => order.paymentStatus === "UNPAID")
            .reduce((sum, order) => sum + number(order.dueAmount), 0),
        },
      ],
      trend: trend(
        completed.map((order) => ({
          date: order.createdAt,
          amount: number(order.totalAmount),
        })),
      ),
      breakdown: breakdown(paymentMap),
      rows: breakdown(cashierMap).map((item) => ({
        cashier: item.label,
        orders: item.count,
        sales: item.amount,
      })),
    };
  }
  if (tab === "expenses") {
    const [expenses, configuredTypes] = await Promise.all([
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: start, lte: end },
          ...(filters.expenseType && filters.expenseType !== "ALL"
            ? { expenseType: filters.expenseType }
            : {}),
        },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.expenseType.findMany({ orderBy: { name: "asc" } }),
    ]);
    const types = new Map<string, BreakdownPoint>(
      configuredTypes.map((type) => [
        type.name,
        { label: type.name, amount: 0, count: 0 },
      ]),
    );
    expenses.forEach((expense) => {
      const row = types.get(expense.expenseType) ?? {
        label: expense.expenseType,
        amount: 0,
        count: 0,
      };
      row.amount += number(expense.amount);
      row.count += 1;
      types.set(expense.expenseType, row);
    });
    const expenseSeries: TrendSeries[] = [...types.values()].map(
      (type, index) => ({
        key: `expense_${index}`,
        label: type.label,
        color: getTrendColor(index),
      }),
    );
    const expenseSeriesKeys = new Map(
      expenseSeries.map((series) => [
        series.label.trim().toLowerCase(),
        series.key,
      ]),
    );
    const expenseTrendMap = new Map<string, TrendChartPoint>();
    expenses.forEach((expense) => {
      const label = expense.expenseDate.toISOString().slice(0, 10);
      const point = expenseTrendMap.get(label) ?? { label };
      const key = expenseSeriesKeys.get(
        expense.expenseType.trim().toLowerCase(),
      );
      if (key) point[key] = Number(point[key] ?? 0) + number(expense.amount);
      expenseTrendMap.set(label, point);
    });
    return {
      tab,
      range: { start: start.toISOString(), end: end.toISOString() },
      kpis: [
        {
          label: "Total expenses",
          value: expenses.reduce(
            (sum, expense) => sum + number(expense.amount),
            0,
          ),
        },
        { label: "Entries", value: expenses.length },
      ],
      trend: trend(
        expenses.map((expense) => ({
          date: expense.expenseDate,
          amount: number(expense.amount),
        })),
      ),
      trendSeries: {
        data: [...expenseTrendMap.values()].sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
        series: expenseSeries,
      },
      breakdown: breakdown(types),
      rows: breakdown(types).map((type) => ({
        expenseType: type.label,
        totalAmount: type.amount,
        entries: type.count,
      })),
    };
  }
  if (tab === "inventory") {
    const movementWhere = { createdAt: { gte: start, lte: end } };
    const [items, movements, allMovements] = await Promise.all([
      prisma.inventoryItem.findMany({ include: { category: true } }),
      prisma.stockMovement.findMany({
        where: {
          ...movementWhere,
          ...(filters.movementType && filters.movementType !== "ALL"
            ? { type: filters.movementType as never }
            : {}),
        },
        include: { inventoryItem: { include: { category: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockMovement.findMany({
        where: movementWhere,
        include: { inventoryItem: { select: { unitCost: true } } },
      }),
    ]);
    const value = items.reduce(
      (sum, item) => sum + number(item.quantity) * number(item.unitCost),
      0,
    );
    const movementMap = new Map<string, BreakdownPoint>();
    movements.forEach((movement) => {
      const row = movementMap.get(movement.type) ?? {
        label: movement.type,
        amount: 0,
        count: 0,
      };
      row.amount +=
        Math.abs(number(movement.quantityChange)) *
        number(movement.inventoryItem.unitCost);
      row.count += 1;
      movementMap.set(movement.type, row);
    });
    const movementQuantity = (type: string) =>
      allMovements
        .filter((movement) => movement.type === type)
        .reduce(
          (total, movement) =>
            total + Math.abs(number(movement.quantityChange)),
          0,
        );
    const movementCost = (type: string) =>
      allMovements
        .filter((movement) => movement.type === type)
        .reduce(
          (total, movement) =>
            total +
            Math.abs(number(movement.quantityChange)) *
              number(movement.inventoryItem.unitCost),
          0,
        );
    const wastedQuantity = movementQuantity("WASTAGE_OUT");
    const expiredQuantity = movementQuantity("SPOILAGE_OUT");
    return {
      tab,
      range: { start: start.toISOString(), end: end.toISOString() },
      kpis: [
        { label: "Inventory value", value },
        {
          label: "Wasted + expired items",
          value: wastedQuantity + expiredQuantity,
        },
        { label: "Wasted cost", value: movementCost("WASTAGE_OUT") },
        { label: "Expired cost", value: movementCost("SPOILAGE_OUT") },
      ],
      trend: [],
      breakdown: breakdown(movementMap),
      inventoryMovements: movements.map((movement) => ({
        id: movement.id,
        inventoryItemId: movement.inventoryItemId,
        inventoryItemName: movement.inventoryItem.name,
        unit: movement.inventoryItem.unit,
        type: movement.type,
        quantityChange: number(movement.quantityChange),
        previousQuantity: number(movement.previousQuantity),
        newQuantity: number(movement.newQuantity),
        reason: movement.reason,
        createdAt: movement.createdAt.toISOString(),
      })),
      rows: movements.slice(0, 100).map((movement) => ({
        item: movement.inventoryItem.name,
        category: movement.inventoryItem.category.name,
        movement: movement.type
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        quantity: Math.abs(number(movement.quantityChange)),
        unit: movement.inventoryItem.unit,
        value:
          Math.abs(number(movement.quantityChange)) *
          number(movement.inventoryItem.unitCost),
        currentStock: number(movement.newQuantity),
        reason: movement.reason ?? "-",
        date: movement.createdAt.toISOString().slice(0, 10),
        time: movement.createdAt.toISOString().slice(11, 16),
      })),
    };
  }
  const payrolls = await prisma.payroll.findMany({
    where: {
      paidAmount: { gt: 0 },
      ...(filters.employeeId ? { userId: filters.employeeId } : {}),
    },
    include: { user: { select: { fullName: true, role: true } } },
    orderBy: { paymentDate: "desc" },
  });
  return {
    tab,
    range: { start: start.toISOString(), end: end.toISOString() },
    kpis: [
      {
        label: "Total paid",
        value: payrolls.reduce((sum, item) => sum + number(item.paidAmount), 0),
      },
      {
        label: "Paid employees",
        value: payrolls.length,
      },
    ],
    trend: [],
    breakdown: [],
    rows: payrolls.map((item) => ({
      employee: item.user.fullName ?? "N/A",
      paidAmount: number(item.paidAmount),
      paymentDate: item.paymentDate?.toISOString().slice(0, 10) ?? "-",
    })),
  };
}

export async function getCompletedOrderReport(filters: ReportFilters) {
  await requireAdmin();
  const { start, end } = rangeFor(filters);
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: "COMPLETED",
      ...(filters.paymentMethod && filters.paymentMethod !== "ALL"
        ? { paymentMethod: filters.paymentMethod as never }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { menuItem: { select: { imageUrl: true } } } },
      cashier: { select: { fullName: true } },
    },
  });

  return orders.map((order) => ({
    order: order.orderNumber,
    date: order.createdAt.toISOString().slice(0, 10),
    cashier: order.cashier?.fullName ?? "Unassigned",
    payment: order.paymentMethod.replaceAll("_", " "),
    total: number(order.totalAmount),
    paid: order.paymentStatus === "PAID" ? "Yes" : "No",
    due: number(order.dueAmount),
    orderDetails: JSON.stringify({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      cashier: order.cashier?.fullName ?? "Unassigned",
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: number(order.subtotal),
      totalAmount: number(order.totalAmount),
      dueAmount: number(order.dueAmount),
      items: order.items.map((item) => ({
        name: item.itemName,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: number(item.unitPrice),
        totalPrice: number(item.totalPrice),
        addOns: item.addOns,
        notes: item.notes,
        imageUrl: item.menuItem?.imageUrl ?? null,
      })),
    }),
  }));
}

export async function getOrderDetails(orderNumber: string) {
  await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { menuItem: { select: { imageUrl: true } } } },
      cashier: { select: { fullName: true, email: true } },
    },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    cashier: order.cashier?.fullName ?? order.cashier?.email ?? "Unassigned",
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: number(order.subtotal),
    totalAmount: number(order.totalAmount),
    cashReceived: number(order.cashReceived),
    changeGiven: number(order.changeGiven),
    dueAmount: number(order.dueAmount),
    notes: order.notes,
    items: order.items.map((item) => ({
      name: item.itemName,
      variant: item.variant,
      quantity: item.quantity,
      unitPrice: number(item.unitPrice),
      totalPrice: number(item.totalPrice),
      addOns: item.addOns,
      notes: item.notes,
      imageUrl: item.menuItem?.imageUrl ?? null,
    })),
  };
}
