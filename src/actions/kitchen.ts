"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  KitchenAddOnItem,
  KitchenOrder,
  KitchenOrdersResponse,
  OrderStatus,
} from "@/types";

/**
 * Safely parse JSON add-ons from DB
 */
function parseAddOns(addOnsRaw: string | null): KitchenAddOnItem[] {
  if (!addOnsRaw) return [];
  try {
    const parsed = JSON.parse(addOnsRaw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { name: item };
        return {
          id: item.id ? String(item.id) : undefined,
          name: String(item.name || "Add-on"),
          price: typeof item.price === "number" ? item.price : undefined,
        };
      });
    }
    return [{ name: String(addOnsRaw) }];
  } catch {
    return [{ name: addOnsRaw }];
  }
}

/**
 * Fetch active and recent kitchen orders with statistics
 */
export async function getKitchenOrders(): Promise<KitchenOrdersResponse> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const dbOrders = await prisma.order.findMany({
      where: {
        OR: [
          { status: { in: ["PENDING", "PREPARING", "READY"] } },
          {
            status: "COMPLETED",
            createdAt: { gte: twentyFourHoursAgo },
          },
        ],
      },
      orderBy: {
        createdAt: "asc", // FIFO order processing for kitchen efficiency
      },
      select: {
        id: true,
        orderNumber: true,
        cashierId: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subtotal: true,
        totalAmount: true,
        customerName: true,
        customerPhone: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        cashier: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            orderId: true,
            menuItemId: true,
            itemName: true,
            variant: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            addOns: true,
            notes: true,
          },
        },
      },
    });

    const orders: KitchenOrder[] = dbOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      cashierId: o.cashierId,
      cashierName:
        o.cashier?.fullName || o.cashier?.email?.split("@")[0] || "Staff",
      status: o.status as OrderStatus,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: Number(o.subtotal),
      totalAmount: Number(o.totalAmount),
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      notes: o.notes,
      items: o.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        variant: item.variant,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        addOns: parseAddOns(item.addOns),
        notes: item.notes,
      })),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    const pendingCount = orders.filter((o) => o.status === "PENDING").length;
    const preparingCount = orders.filter(
      (o) => o.status === "PREPARING",
    ).length;
    const readyCount = orders.filter((o) => o.status === "READY").length;
    const completedTodayCount = orders.filter(
      (o) => o.status === "COMPLETED",
    ).length;

    return {
      success: true,
      orders,
      stats: {
        totalActive: pendingCount + preparingCount + readyCount,
        pendingCount,
        preparingCount,
        readyCount,
        completedTodayCount,
      },
    };
  } catch (error) {
    console.error("[getKitchenOrders] Error:", error);
    return {
      success: false,
      orders: [],
      stats: {
        totalActive: 0,
        pendingCount: 0,
        preparingCount: 0,
        readyCount: 0,
        completedTodayCount: 0,
      },
      error: "Failed to load kitchen orders. Please check network connection.",
    };
  }
}

/**
 * Update Kitchen Order Status (PENDING -> PREPARING -> READY -> COMPLETED / CANCELLED)
 */
export async function updateKitchenOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!orderId || typeof orderId !== "string") {
      return { success: false, error: "Invalid Order ID" };
    }

    const validStatuses: OrderStatus[] = [
      "PENDING",
      "PREPARING",
      "READY",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status value provided" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/kitchen");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("[updateKitchenOrderStatus] Error:", error);
    return { success: false, error: "Unable to update order status" };
  }
}
