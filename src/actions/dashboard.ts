"use server";

import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { BreakdownPoint, DashboardData, TrendPoint } from "@/types/reports";

function todayRange() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function money(value: unknown) {
  return Number(value ?? 0);
}

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  const { start, end } = todayRange();
  const [
    orders,
    expenses,
    lowStock,
    outOfStock,
    kitchenOrders,
    attendance,
    payroll,
    recentExpenses,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        dueAmount: true,
        createdAt: true,
        items: { select: { itemName: true, quantity: true, totalPrice: true } },
      },
    }),
    prisma.expense.findMany({
      where: { expenseDate: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.inventoryItem.findMany({
      select: { quantity: true, minStockLevel: true },
    }),
    prisma.inventoryItem.count({ where: { quantity: { lte: 0 } } }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { date: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.payroll.aggregate({
      where: { status: "DRAFT" },
      _sum: { netSalary: true },
    }),
    prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const completed = orders.filter((order) => order.status === "COMPLETED");
  const sales = completed.reduce(
    (sum, order) => sum + money(order.totalAmount),
    0,
  );
  const expenseTotal = expenses.reduce(
    (sum, expense) => sum + money(expense.amount),
    0,
  );
  const trendMap = new Map<string, TrendPoint>();
  completed.forEach((order) => {
    const label = `${String(order.createdAt.getUTCHours()).padStart(2, "0")}:00`;
    const point = trendMap.get(label) ?? { label, amount: 0, count: 0 };
    point.amount += money(order.totalAmount);
    point.count += 1;
    trendMap.set(label, point);
  });
  const paymentMap = new Map<string, BreakdownPoint>();
  completed.forEach((order) => {
    const point = paymentMap.get(order.paymentMethod) ?? {
      label: order.paymentMethod,
      amount: 0,
      count: 0,
    };
    point.amount += money(order.totalAmount);
    point.count += 1;
    paymentMap.set(order.paymentMethod, point);
  });
  const itemMap = new Map<string, BreakdownPoint>();
  completed
    .flatMap((order) => order.items)
    .forEach((item) => {
      const point = itemMap.get(item.itemName) ?? {
        label: item.itemName,
        amount: 0,
        count: 0,
      };
      point.amount += money(item.totalPrice);
      point.count += item.quantity;
      itemMap.set(item.itemName, point);
    });
  const statusMap = new Map<string, BreakdownPoint>();
  orders.forEach((order) => {
    const point = statusMap.get(order.status) ?? {
      label: order.status,
      amount: 0,
      count: 0,
    };
    point.amount += money(order.totalAmount);
    point.count += 1;
    statusMap.set(order.status, point);
  });
  const present =
    attendance.find((item) => item.status === "PRESENT")?._count._all ?? 0;
  const absent =
    attendance.find((item) => item.status === "ABSENT")?._count._all ?? 0;

  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    kpis: {
      sales,
      orders: completed.length,
      averageOrder: completed.length ? sales / completed.length : 0,
      outstanding: orders
        .filter((order) => order.paymentStatus === "UNPAID")
        .reduce((sum, order) => sum + money(order.dueAmount), 0),
      expenses: expenseTotal,
      operatingResult: sales - expenseTotal,
    },
    salesTrend: [...trendMap.values()].sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
    paymentMix: [...paymentMap.values()].sort((a, b) => b.amount - a.amount),
    orderStatus: [...statusMap.values()].sort((a, b) => b.count - a.count),
    topItems: [...itemMap.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    alerts: [
      {
        label: "Low stock items",
        value: lowStock.filter(
          (item) =>
            money(item.quantity) > 0 &&
            money(item.quantity) <= money(item.minStockLevel),
        ).length,
        tone: "warning",
      },
      { label: "Out of stock items", value: outOfStock, tone: "danger" },
      { label: "Active kitchen orders", value: kitchenOrders, tone: "info" },
      {
        label: "Draft payroll records",
        value: money(payroll._sum.netSalary),
        tone: "warning",
      },
    ],
    workforce: {
      present,
      absent,
      payrollOutstanding: money(payroll._sum.netSalary),
    },
    recentExpenses: recentExpenses.map((expense) => ({
      id: expense.id,
      title: expense.title,
      type: expense.expenseType,
      amount: money(expense.amount),
      date: expense.expenseDate.toISOString().slice(0, 10),
    })),
  };
}
