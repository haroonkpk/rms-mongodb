"use server";

import { getCurrentUser } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  CustomerStatus,
  CustomerLedgerEntryType,
} from "../../prisma/generated";
import { revalidatePath } from "next/cache";

async function requireCustomerAccess() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "CASHIER")) {
    throw new Error("Unauthorized");
  }
  return user;
}

function toCustomerSummary(customer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes?: string | null;
  status: CustomerStatus;
  createdAt: Date;
  orders: {
    id: string;
    orderNumber: string;
    totalAmount: unknown;
    dueAmount: unknown;
    paymentMethod: string;
    paymentStatus?: string;
    createdAt: Date;
  }[];
  ledgerEntries: {
    id: string;
    type: CustomerLedgerEntryType;
    amount: unknown;
    note: string | null;
    createdAt: Date;
    order: { orderNumber: string } | null;
  }[];
}) {
  const charges = customer.ledgerEntries
    .filter((entry) => entry.type === CustomerLedgerEntryType.CHARGE)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const payments = customer.ledgerEntries
    .filter((entry) => entry.type === CustomerLedgerEntryType.PAYMENT)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    notes: customer.notes ?? null,
    status: customer.status,
    createdAt: customer.createdAt.toISOString(),
    totalOrders: customer.orders.length,
    ledgerBalance: charges - payments,
    orders: customer.orders
      .filter((order) => order.paymentMethod === "LEDGER")
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        dueAmount: order.dueAmount ? Number(order.dueAmount) : 0,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt.toISOString(),
      })),
    ledgerEntries: customer.ledgerEntries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: Number(entry.amount),
      note: entry.note,
      orderNumber: entry.order?.orderNumber ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function getCustomers(search = "", status = "ALL") {
  try {
    await requireCustomerAccess();
    const normalizedSearch = search.trim();
    const customers = await prisma.customer.findMany({
      where: {
        ...(normalizedSearch
          ? {
              OR: [
                { name: { contains: normalizedSearch, mode: "insensitive" } },
                { phone: { contains: normalizedSearch, mode: "insensitive" } },
                { email: { contains: normalizedSearch, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status !== "ALL" ? { status: status as CustomerStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            dueAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          include: { order: { select: { orderNumber: true } } },
        },
      },
    });

    return { success: true, customers: customers.map(toCustomerSummary) };
  } catch (error) {
    console.error("Get customers error:", error);
    return { success: false, error: "Unable to load customers", customers: [] };
  }
}

export async function getCustomerDetails(id: string) {
  try {
    await requireCustomerAccess();
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            dueAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          include: { order: { select: { orderNumber: true } } },
        },
      },
    });
    if (!customer) return { success: false, error: "Customer not found" };

    const charges = customer.ledgerEntries
      .filter((entry) => entry.type === CustomerLedgerEntryType.CHARGE)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const payments = customer.ledgerEntries
      .filter((entry) => entry.type === CustomerLedgerEntryType.PAYMENT)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        status: customer.status,
        totalOrders: customer.orders.length,
        ledgerBalance: charges - payments,
        orders: customer.orders
          .filter((order) => order.paymentMethod === "LEDGER")
          .map((order) => ({
            ...order,
            totalAmount: Number(order.totalAmount),
            dueAmount: order.dueAmount ? Number(order.dueAmount) : 0,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt.toISOString(),
          })),
        ledgerEntries: customer.ledgerEntries.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amount: Number(entry.amount),
          note: entry.note,
          orderNumber: entry.order?.orderNumber ?? null,
          createdAt: entry.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Get customer details error:", error);
    return { success: false, error: "Unable to load customer details" };
  }
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}) {
  try {
    await requireCustomerAccess();
    const name = data.name.trim();
    const phone = data.phone.trim();
    if (!name || !phone)
      return { success: false, error: "Name and phone are required" };

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath("/customers");
    return {
      success: true,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
    };
  } catch (error) {
    console.error("Create customer error:", error);
    return {
      success: false,
      error: "A customer with this phone may already exist",
    };
  }
}

export async function updateCustomer(
  id: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    status: CustomerStatus;
  },
) {
  try {
    await requireCustomerAccess();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status,
      },
    });
    revalidatePath("/customers");
    return { success: true, customer: { id: customer.id } };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, error: "Unable to update customer" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await requireCustomerAccess();
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { success: false, error: "Unable to delete customer" };
  }
}

export async function recordCustomerPayment(data: {
  customerId: string;
  amount: number;
  note?: string;
}) {
  try {
    await requireCustomerAccess();
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      return {
        success: false,
        error: "Payment amount must be greater than zero",
      };
    }
    const result = await prisma.$transaction(async (transaction) => {
      const orders = await transaction.order.findMany({
        where: {
          customerId: data.customerId,
          paymentMethod: "LEDGER",
          paymentStatus: "UNPAID",
          dueAmount: { gt: 0 },
        },
        select: { id: true, dueAmount: true },
        orderBy: { createdAt: "asc" },
      });
      const outstanding = orders.reduce(
        (sum, order) => sum + Number(order.dueAmount ?? 0),
        0,
      );
      if (data.amount > outstanding) {
        throw new Error(
          `Payment cannot exceed the outstanding balance of Rs. ${outstanding.toLocaleString()}.`,
        );
      }

      let remaining = data.amount;
      const allocations: Array<{
        orderId: string;
        amount: number;
        dueAmount: number;
        paymentStatus: "PAID" | "UNPAID";
      }> = [];

      for (const order of orders) {
        if (remaining <= 0) break;
        const currentDue = Number(order.dueAmount ?? 0);
        const applied = Math.min(remaining, currentDue);
        const dueAmount = currentDue - applied;
        const paymentStatus = dueAmount === 0 ? "PAID" : "UNPAID";
        await transaction.order.update({
          where: { id: order.id },
          data: { dueAmount, paymentStatus },
        });
        allocations.push({
          orderId: order.id,
          amount: applied,
          dueAmount,
          paymentStatus,
        });
        remaining -= applied;
      }

      await transaction.customerLedgerEntry.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          type: CustomerLedgerEntryType.PAYMENT,
          note: data.note?.trim() || null,
        },
      });
      return allocations;
    });
    revalidatePath("/customers");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
    revalidatePath("/pos/live");
    return { success: true, allocations: result };
  } catch (error) {
    console.error("Record customer payment error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to record payment",
    };
  }
}

export async function searchCustomers(search = "") {
  try {
    await requireCustomerAccess();
    const customers = await prisma.customer.findMany({
      where: {
        status: CustomerStatus.ACTIVE,
        ...(search.trim()
          ? {
              OR: [
                { name: { contains: search.trim(), mode: "insensitive" } },
                { phone: { contains: search.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 1000,
    });
    return { success: true, customers };
  } catch (error) {
    console.error("Search customers error:", error);
    return { success: false, customers: [] };
  }
}
