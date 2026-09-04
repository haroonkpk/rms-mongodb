"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import {
  POSAddOn,
  POSMenuItem,
  POSCategory,
  POSOrderPayload,
  POSInitDataResponse,
  POSOrderResult,
} from "@/types/pos";


export const getCachedPOSCatalog = unstable_cache(
  async () => {
    // Categories
    const dbCategories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    // Menu Items
    const dbMenuItems = await prisma.menuItem.findMany({
      orderBy: { name: "asc" },
      include: {
        category: true,
        addOns: true,
      },
    });

    const categories: POSCategory[] = dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.menuItems,
    }));

    const menuItems: POSMenuItem[] = dbMenuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: Number(item.basePrice),
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      hasSizes: item.hasSizes ?? false,
      sizes: Array.isArray(item.sizes)
        ? (item.sizes as unknown as { name: string; price: number }[])
        : [],
      addOns: item.addOns.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price),
        isAvailable: addon.isAvailable,
      })),
    }));

    return { categories, menuItems };
  },
  ["pos-catalog-data"],
  {
    tags: ["pos-data"],
    revalidate: 3600, // 1 hour server cache window
  }
);

export async function getPOSInitData(): Promise<POSInitDataResponse> {
  try {
    const user = await getCurrentUser();
    const { categories, menuItems } = await getCachedPOSCatalog();

    return {
      success: true,
      cashier: user || null,
      categories,
      menuItems,
    };
  } catch (error) {
    console.error("Error fetching POS init data:", error);
    return {
      success: false,
      error: "Failed to load POS data",
      cashier: null,
      categories: [],
      menuItems: [],
    };
  }
}

export async function createPOSOrder(
  payload: POSOrderPayload,
): Promise<POSOrderResult> {
  try {
    const user = await getCurrentUser();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomSuffix}`;

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Bill is empty" };
    }

    let savedOrderId = null;
    let savedKotNumber: number | null = null;
    try {
      const isLedger = payload.paymentMethod === "LEDGER";

      // Calculate daily resetting KOT number (resets every night at 12 AM midnight)
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

      const lastOrderToday = await prisma.order.findFirst({
        where: {
          createdAt: {
            gte: startOfToday,
          },
          kotNumber: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          kotNumber: true,
        },
      });

      const nextKotNumber = (lastOrderToday?.kotNumber ?? 0) + 1;

      const dbOrder = await prisma.order.create({
        data: {
          orderNumber,
          kotNumber: nextKotNumber,
          cashierId: user?.id || null,
          status: payload.status || "PENDING",
          paymentMethod: payload.paymentMethod,
          paymentStatus:
            payload.paymentStatus || (isLedger ? "UNPAID" : "PAID"),
          subtotal: payload.subtotal,
          totalAmount: payload.totalAmount,
          cashReceived:
            payload.cashReceived ?? (isLedger ? 0 : payload.totalAmount),
          changeGiven: payload.changeGiven ?? 0,
          dueAmount: payload.dueAmount ?? (isLedger ? payload.totalAmount : 0),
          customerName: payload.customerName || null,
          customerPhone: payload.customerPhone || null,
          notes: payload.notes || null,
          items: {
            create: payload.items.map((item) => ({
              menuItemId: item.itemId.startsWith("item-") ? null : item.itemId,
              itemName: item.name,
              variant: item.variant?.name || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.itemTotal,
              addOns:
                item.addOns.length > 0 ? JSON.stringify(item.addOns) : null,
              notes: item.notes || null,
            })),
          },
        },
      });
      savedOrderId = dbOrder.id;
      savedKotNumber = dbOrder.kotNumber;
    } catch (err) {
      console.warn("DB order insertion warning:", err);
    }

    revalidatePath("/pos");
    revalidateTag("pos-data", "max");

    return {
      success: true,
      orderNumber,
      kotNumber: savedKotNumber,
      orderId: savedOrderId,
      createdAt: new Date().toLocaleString(),
      cashierName:
        user?.fullName || user?.email?.split("@")[0] || "Cashier Staff",
      payload,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Failed to process order. Please try again.",
    };
  }
}
