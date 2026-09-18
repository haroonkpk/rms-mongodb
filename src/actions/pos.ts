"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { isMenuItemAvailable } from "@/lib/menu-availability";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  POSMenuItem,
  POSCategory,
  POSOrderPayload,
  POSInitDataResponse,
  POSOrderResult,
} from "@/types/pos";

export async function getPOSCatalog() {
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

  const inventoryItemIds = dbMenuItems.flatMap((item) => {
    const itemIngredientIds = Array.isArray(item.ingredients)
      ? item.ingredients.flatMap((ingredient) => {
          if (!ingredient || typeof ingredient !== "object") return [];
          const inventoryItemId = (ingredient as { inventoryItemId?: unknown })
            .inventoryItemId;
          return typeof inventoryItemId === "string" ? [inventoryItemId] : [];
        })
      : [];
    const addOnIngredientIds = item.addOns.flatMap((addOn) =>
      Array.isArray(addOn.ingredients)
        ? addOn.ingredients.flatMap((ingredient) => {
            if (!ingredient || typeof ingredient !== "object") return [];
            const inventoryItemId = (
              ingredient as { inventoryItemId?: unknown }
            ).inventoryItemId;
            return typeof inventoryItemId === "string" ? [inventoryItemId] : [];
          })
        : [],
    );
    return [...itemIngredientIds, ...addOnIngredientIds];
  });
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { id: { in: inventoryItemIds } },
    select: { id: true, quantity: true },
  });
  const stockByInventoryId = new Map(
    inventoryItems.map((inventoryItem) => [
      inventoryItem.id,
      Number(inventoryItem.quantity),
    ]),
  );

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
    isAvailable: isMenuItemAvailable(
      item.isAvailable,
      item.ingredients,
      stockByInventoryId,
    ),
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
      isAvailable: isMenuItemAvailable(
        addon.isAvailable,
        addon.ingredients,
        stockByInventoryId,
      ),
    })),
  }));

  return { categories, menuItems };
}

export async function getPOSInitData(): Promise<POSInitDataResponse> {
  try {
    const user = await getCurrentUser();
    const { categories, menuItems } = await getPOSCatalog();

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

export async function getNextKotNumber(): Promise<number> {
  const sequence = await prisma.kotSequence.findUnique({
    where: { id: 1 },
  });
  const now = new Date();

  if (
    !sequence ||
    !sequence.windowStartedAt ||
    now.getTime() - sequence.windowStartedAt.getTime() >= 24 * 60 * 60 * 1000
  ) {
    return 1;
  }

  return sequence.currentNumber + 1;
}

export async function getKotSequence() {
  const sequence = await prisma.kotSequence.findUnique({ where: { id: 1 } });
  return {
    currentNumber: sequence?.currentNumber ?? 0,
    windowStartedAt: sequence?.windowStartedAt?.toISOString() ?? null,
  };
}

export async function resetKotSequence() {
  await prisma.kotSequence.upsert({
    where: { id: 1 },
    update: { currentNumber: 0, windowStartedAt: new Date() },
    create: { id: 1, currentNumber: 0, windowStartedAt: new Date() },
  });
  revalidatePath("/pos/live");
  revalidatePath("/pos");
  return { success: true };
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

    const requestedMenuItemIds = payload.items
      .map((item) => item.itemId)
      .filter((id) => !id.startsWith("item-"));
    const requestedAddOnIds = payload.items.flatMap((item) =>
      item.addOns.map((addOn) => addOn.id),
    );
    const [menuItems, addOns] = await Promise.all([
      prisma.menuItem.findMany({
        where: { id: { in: requestedMenuItemIds } },
        select: { id: true, ingredients: true },
      }),
      prisma.addOn.findMany({
        where: { id: { in: requestedAddOnIds } },
        select: { id: true, ingredients: true },
      }),
    ]);
    const menuItemMap = new Map(
      menuItems.map((item) => [item.id, item.ingredients]),
    );
    const addOnMap = new Map(
      addOns.map((addOn) => [addOn.id, addOn.ingredients]),
    );
    const requiredByInventoryId = new Map<string, number>();

    const addRequirements = (rawIngredients: unknown, multiplier: number) => {
      if (!Array.isArray(rawIngredients)) return;
      for (const ingredient of rawIngredients) {
        if (!ingredient || typeof ingredient !== "object") continue;
        const value = ingredient as {
          inventoryItemId?: unknown;
          quantityRequired?: unknown;
        };
        const inventoryItemId = value.inventoryItemId;
        const quantityRequired = Number(value.quantityRequired);
        if (
          typeof inventoryItemId !== "string" ||
          !inventoryItemId ||
          !Number.isFinite(quantityRequired) ||
          quantityRequired <= 0
        ) {
          continue;
        }
        requiredByInventoryId.set(
          inventoryItemId,
          (requiredByInventoryId.get(inventoryItemId) ?? 0) +
            quantityRequired * multiplier,
        );
      }
    };

    for (const item of payload.items) {
      addRequirements(menuItemMap.get(item.itemId), item.quantity);
      for (const addOn of item.addOns) {
        addRequirements(addOnMap.get(addOn.id), item.quantity);
      }
    }

    if (requiredByInventoryId.size > 0) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { id: { in: [...requiredByInventoryId.keys()] } },
        select: { id: true, name: true, quantity: true, unit: true },
      });
      const loadedInventoryIds = new Set(
        inventoryItems.map((inventoryItem) => inventoryItem.id),
      );
      const missingInventoryId = [...requiredByInventoryId.keys()].find(
        (inventoryItemId) => !loadedInventoryIds.has(inventoryItemId),
      );
      if (missingInventoryId) {
        return {
          success: false,
          error:
            "This order has an ingredient that is not available in inventory.",
        };
      }
      const unavailable = inventoryItems.find(
        (inventoryItem) =>
          Number(inventoryItem.quantity) <
          (requiredByInventoryId.get(inventoryItem.id) ?? 0),
      );
      if (unavailable) {
        return {
          success: false,
          error: `${unavailable.name} does not have enough stock to place this order.`,
        };
      }
    }

    let savedOrderId = null;
    let savedKotNumber: number | null = null;
    try {
      const isLedger = payload.paymentMethod === "LEDGER";

      if (isLedger) {
        if (!payload.customerId) {
          return {
            success: false,
            error: "Select or create a customer before placing a ledger order.",
          };
        }
        const customer = await prisma.customer.findUnique({
          where: { id: payload.customerId },
          select: { id: true, name: true, phone: true, status: true },
        });
        if (!customer || customer.status !== "ACTIVE") {
          return { success: false, error: "Select an active customer." };
        }
        payload.customerName = customer.name;
        payload.customerPhone = customer.phone;
      }

      const now = new Date();
      const sequence = await prisma.kotSequence.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, currentNumber: 0, windowStartedAt: now },
      });
      const windowExpired =
        !sequence.windowStartedAt ||
        now.getTime() - sequence.windowStartedAt.getTime() >=
          24 * 60 * 60 * 1000;
      const nextKotNumber = windowExpired ? 1 : sequence.currentNumber + 1;

      await prisma.kotSequence.update({
        where: { id: 1 },
        data: {
          currentNumber: nextKotNumber,
          ...(windowExpired ? { windowStartedAt: now } : {}),
        },
      });

      const dbOrder = await prisma.order.create({
        data: {
          orderNumber,
          kotNumber: nextKotNumber,
          cashierId: user?.id || null,
          customerId: isLedger ? payload.customerId : null,
          orderType: payload.orderType,
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
          ledgerEntries: isLedger
            ? {
                create: {
                  customerId: payload.customerId!,
                  type: "CHARGE",
                  amount: payload.totalAmount,
                  note: payload.notes || null,
                },
              }
            : undefined,
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
