"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ExpensePaymentMethod } from "../../prisma/generated";

export interface ExpenseData {
  id: string;
  title: string;
  expenseType: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  notes: string | null;
  createdAt: string;
}

export interface ExpenseSummary {
  totalAmount: number;
  expenseCount: number;
  currentMonthAmount: number;
  currentMonthCount: number;
}

export interface ExpenseTypeData {
  id: string;
  name: string;
  expenseCount: number;
  createdAt: string;
}

const expensePath = "/admin/expenses";

function formatExpense(expense: {
  id: string;
  title: string;
  expenseType: string;
  amount: unknown;
  expenseDate: Date;
  paymentMethod: ExpensePaymentMethod;
  notes: string | null;
  createdAt: Date;
}): ExpenseData {
  return {
    id: expense.id,
    title: expense.title,
    expenseType: expense.expenseType,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    createdAt: expense.createdAt.toISOString(),
  };
}

export async function getExpenses(
  page = 1,
  pageSize = 10,
  search = "",
  expenseType = "ALL",
  month = "ALL",
) {
  try {
    const selectedMonthStart =
      month !== "ALL" ? new Date(`${month}-01T00:00:00.000Z`) : null;
    const selectedMonthEnd = selectedMonthStart
      ? new Date(
          Date.UTC(
            selectedMonthStart.getUTCFullYear(),
            selectedMonthStart.getUTCMonth() + 1,
            1,
          ),
        )
      : null;
    const where = {
      ...(search.trim()
        ? {
            OR: [
              {
                title: {
                  contains: search.trim(),
                  mode: "insensitive" as const,
                },
              },
              {
                notes: {
                  contains: search.trim(),
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(expenseType !== "ALL" ? { expenseType } : {}),
      ...(month !== "ALL"
        ? {
            expenseDate: {
              gte: selectedMonthStart!,
              lt: selectedMonthEnd!,
            },
          }
        : {}),
    };

    const [expenses, total, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const currentMonth = await prisma.expense.aggregate({
      where: { expenseDate: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return {
      success: true,
      expenses: expenses.map(formatExpense),
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      expenseTypes: await prisma.expenseType
        .findMany({
          select: { name: true },
          orderBy: { createdAt: "asc" },
        })
        .then((rows) => rows.map((row) => row.name)),
      summary: {
        totalAmount: Number(aggregate._sum.amount ?? 0),
        expenseCount: total,
        currentMonthAmount: Number(currentMonth._sum.amount ?? 0),
        currentMonthCount: currentMonth._count._all,
      } satisfies ExpenseSummary,
    };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return {
      success: false,
      error: "Failed to fetch expenses",
      expenses: [],
      total: 0,
      totalPages: 1,
      expenseTypes: [],
      summary: {
        totalAmount: 0,
        expenseCount: 0,
        currentMonthAmount: 0,
        currentMonthCount: 0,
      },
    };
  }
}

export async function getExpenseTypes() {
  try {
    const expenseTypes = await prisma.expenseType.findMany({
      orderBy: { createdAt: "asc" },
    });
    const expenseCounts = await prisma.expense.groupBy({
      by: ["expenseType"],
      _count: { _all: true },
    });
    return {
      success: true,
      expenseTypes: expenseTypes.map(
        (expenseType) =>
          ({
            id: expenseType.id,
            name: expenseType.name,
            expenseCount:
              expenseCounts.find(
                (item) => item.expenseType === expenseType.name,
              )?._count._all ?? 0,
            createdAt: expenseType.createdAt.toISOString(),
          }) satisfies ExpenseTypeData,
      ),
    };
  } catch (error) {
    console.error("Error fetching expense types:", error);
    return {
      success: false,
      error: "Failed to fetch expense types",
      expenseTypes: [],
    };
  }
}

export async function createExpenseType(data: { name: string }) {
  const name = data.name.trim();
  if (!name) return { success: false, error: "Expense type name is required." };
  try {
    await prisma.expenseType.create({ data: { name } });
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error creating expense type:", error);
    return {
      success: false,
      error: "Expense type already exists or could not be created.",
    };
  }
}

export async function updateExpenseType(id: string, data: { name: string }) {
  const name = data.name.trim();
  if (!name) return { success: false, error: "Expense type name is required." };
  try {
    const current = await prisma.expenseType.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Expense type not found." };
    await prisma.$transaction([
      prisma.expenseType.update({ where: { id }, data: { name } }),
      prisma.expense.updateMany({
        where: { expenseType: current.name },
        data: { expenseType: name },
      }),
    ]);
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error updating expense type:", error);
    return {
      success: false,
      error: "Expense type already exists or could not be updated.",
    };
  }
}

export async function deleteExpenseType(id: string) {
  try {
    const expenseType = await prisma.expenseType.findUnique({ where: { id } });
    if (!expenseType)
      return { success: false, error: "Expense type not found." };
    const linkedExpenses = await prisma.expense.count({
      where: { expenseType: expenseType.name },
    });
    if (linkedExpenses > 0)
      return {
        success: false,
        error: "This expense type is used by existing expenses.",
      };
    await prisma.expenseType.delete({ where: { id } });
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense type:", error);
    return { success: false, error: "Failed to delete expense type." };
  }
}

export async function createExpense(data: {
  title: string;
  expenseType: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  notes?: string;
}) {
  if (
    !data.title.trim() ||
    !data.expenseType.trim() ||
    data.amount <= 0 ||
    !data.expenseDate
  ) {
    return {
      success: false,
      error: "Title, expense type, date, and a valid amount are required.",
    };
  }

  try {
    await prisma.expense.create({
      data: {
        title: data.title.trim(),
        expenseType: data.expenseType.trim(),
        amount: data.amount,
        expenseDate: new Date(`${data.expenseDate}T00:00:00.000Z`),
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense." };
  }
}

export async function updateExpense(
  id: string,
  data: Parameters<typeof createExpense>[0],
) {
  if (
    !data.title.trim() ||
    !data.expenseType.trim() ||
    data.amount <= 0 ||
    !data.expenseDate
  ) {
    return {
      success: false,
      error: "Title, expense type, date, and a valid amount are required.",
    };
  }

  try {
    await prisma.expense.update({
      where: { id },
      data: {
        title: data.title.trim(),
        expenseType: data.expenseType.trim(),
        amount: data.amount,
        expenseDate: new Date(`${data.expenseDate}T00:00:00.000Z`),
        paymentMethod: data.paymentMethod,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense." };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath(expensePath);
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense." };
  }
}
