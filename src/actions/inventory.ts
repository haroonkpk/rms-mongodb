"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  InventoryUnit,
  StockMovementType,
  Prisma,
} from "../../prisma/generated";

export interface InventoryCategoryData {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemData {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: InventoryUnit;
  quantity: number;
  minStockLevel: number;
  unitCost: number;
  stockStatus: "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK";
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  unit: InventoryUnit;
  type: StockMovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
}

export interface StockIntakeBatchItemData {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unitCost: number;
  totalPrice: number;
}

export interface StockIntakeBatchData {
  id: string;
  batchNumber: string;
  notes: string | null;
  totalAmount: number;
  items: StockIntakeBatchItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
}

// ----------------------------------------------------
// STATS ACTION
// ----------------------------------------------------

export async function getInventoryStats(): Promise<{
  success: boolean;
  stats?: InventoryStats;
  error?: string;
}> {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: {
        quantity: true,
        minStockLevel: true,
        unitCost: true,
      },
    });

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      const qty = Number(item.quantity);
      const minLevel = Number(item.minStockLevel);
      const cost = Number(item.unitCost);

      totalValuation += qty * cost;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= minLevel) {
        lowStockCount++;
      }
    });

    return {
      success: true,
      stats: {
        totalItems: items.length,
        totalValuation,
        lowStockCount,
        outOfStockCount,
      },
    };
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return { success: false, error: "Failed to calculate inventory stats" };
  }
}

// ----------------------------------------------------
// INVENTORY CATEGORIES ACTIONS
// ----------------------------------------------------

export async function getInventoryCategories() {
  try {
    const categories = await prisma.inventoryCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const formatted: InventoryCategoryData[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      itemCount: cat._count.items,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));

    return { success: true, categories: formatted };
  } catch (error) {
    console.error("Error fetching inventory categories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      categories: [],
    };
  }
}

export async function createInventoryCategory(data: { name: string }) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    const existing = await prisma.inventoryCategory.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return {
        success: false,
        error: "Category with this name already exists",
      };
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: trimmedName,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true, categoryId: category.id };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create inventory category" };
  }
}

export async function updateInventoryCategory(
  id: string,
  data: { name: string },
) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    const existing = await prisma.inventoryCategory.findFirst({
      where: {
        name: trimmedName,
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Another category with this name already exists",
      };
    }

    await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: trimmedName,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteInventoryCategory(id: string) {
  try {
    await prisma.inventoryCategory.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory category:", error);
    return {
      success: false,
      error:
        "Failed to delete category. Make sure it has no linked stock items.",
    };
  }
}

// ----------------------------------------------------
// INVENTORY ITEMS ACTIONS
// ----------------------------------------------------

export async function getInventoryItems(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  categoryId: string = "ALL",
  stockStatusFilter: "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK" = "ALL",
) {
  try {
    const skip = (page - 1) * pageSize;

    const whereConditions: Array<Record<string, unknown>> = [];

    if (search) {
      whereConditions.push({
        name: { contains: search, mode: "insensitive" as const },
      });
    }

    if (categoryId && categoryId !== "ALL") {
      whereConditions.push({ categoryId });
    }

    const whereClause =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    });

    let formatted: InventoryItemData[] = items.map((item) => {
      const qty = Number(item.quantity);
      const minLevel = Number(item.minStockLevel);
      const cost = Number(item.unitCost);

      let stockStatus: "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK" = "GOOD";
      if (qty <= 0) stockStatus = "OUT_OF_STOCK";
      else if (qty <= minLevel) stockStatus = "LOW_STOCK";

      return {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.category.name,
        unit: item.unit,
        quantity: qty,
        minStockLevel: minLevel,
        unitCost: cost,
        stockStatus,
        totalValue: qty * cost,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    if (stockStatusFilter !== "ALL") {
      formatted = formatted.filter(
        (item) => item.stockStatus === stockStatusFilter,
      );
    }

    const total = formatted.length;
    const paginatedItems = formatted.slice(skip, skip + pageSize);

    return {
      success: true,
      items: paginatedItems,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return {
      success: false,
      error: "Failed to fetch inventory items",
      items: [],
      total: 0,
      totalPages: 1,
    };
  }
}

export async function createInventoryItem(data: {
  name: string;
  categoryId: string;
  unit: InventoryUnit;
  quantity?: number;
  minStockLevel?: number;
  unitCost?: number;
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Item name is required" };
    }
    if (!data.categoryId) {
      return { success: false, error: "Category is required" };
    }

    const initialQty = data.quantity ?? 0;

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId,
        unit: data.unit,
        quantity: initialQty,
        minStockLevel: data.minStockLevel ?? 10,
        unitCost: data.unitCost ?? 0,
      },
    });

    if (initialQty > 0) {
      await prisma.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          type: StockMovementType.PURCHASE_IN,
          quantityChange: initialQty,
          previousQuantity: 0,
          newQuantity: initialQty,
          reason: "Initial stock intake on creation",
        },
      });
    }

    revalidatePath("/admin/inventory");
    return { success: true, itemId: item.id };
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return { success: false, error: "Failed to create inventory item" };
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    name: string;
    categoryId: string;
    unit: InventoryUnit;
    minStockLevel?: number;
    unitCost?: number;
  },
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Item name is required" };
    }
    if (!data.categoryId) {
      return { success: false, error: "Category is required" };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId,
        unit: data.unit,
        minStockLevel: data.minStockLevel ?? 10,
        unitCost: data.unitCost ?? 0,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return { success: false, error: "Failed to update inventory item" };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return { success: false, error: "Failed to delete inventory item" };
  }
}

// ----------------------------------------------------
// STOCK ADJUSTMENT & AUDIT LOG ACTIONS
// ----------------------------------------------------

export async function adjustStock(data: {
  inventoryItemId: string;
  quantityChange: number;
  type: StockMovementType;
  reason?: string;
}) {
  try {
    if (!data.inventoryItemId) {
      return { success: false, error: "Inventory item is required" };
    }
    if (!data.quantityChange || data.quantityChange === 0) {
      return { success: false, error: "Quantity change must be non-zero" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!currentItem) {
        throw new Error("Inventory item not found");
      }

      const prevQty = Number(currentItem.quantity);
      const change = Number(data.quantityChange);
      const newQty = Math.max(0, prevQty + change);

      const updatedItem = await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: {
          quantity: newQty,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          type: data.type,
          quantityChange: change,
          previousQuantity: prevQty,
          newQuantity: newQty,
          reason: data.reason?.trim() || null,
        },
      });

      return { updatedItem, movement };
    });

    revalidatePath("/admin/inventory");
    return { success: true, newQuantity: Number(result.updatedItem.quantity) };
  } catch (error: unknown) {
    console.error("Error adjusting stock:", error);
    const errMessage =
      error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false, error: errMessage };
  }
}

export async function getStockMovements(
  page: number = 1,
  pageSize: number = 15,
  movementType: string = "ALL",
) {
  try {
    const skip = (page - 1) * pageSize;

    const whereClause: Record<string, unknown> = {};
    if (movementType && movementType !== "ALL") {
      whereClause.type = movementType as StockMovementType;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          inventoryItem: true,
        },
      }),
      prisma.stockMovement.count({ where: whereClause }),
    ]);

    const formatted: StockMovementData[] = movements.map((m) => ({
      id: m.id,
      inventoryItemId: m.inventoryItemId,
      inventoryItemName: m.inventoryItem.name,
      unit: m.inventoryItem.unit,
      type: m.type,
      quantityChange: Number(m.quantityChange),
      previousQuantity: Number(m.previousQuantity),
      newQuantity: Number(m.newQuantity),
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      success: true,
      movements: formatted,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return {
      success: false,
      error: "Failed to fetch movement logs",
      movements: [],
      total: 0,
      totalPages: 1,
    };
  }
}

// ----------------------------------------------------
// STOCK INTAKE BATCHES ACTIONS (Bulk Restock Entry)
// ----------------------------------------------------

export async function getStockIntakeBatches() {
  try {
    const batches = await prisma.stockIntakeBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    const formatted: StockIntakeBatchData[] = batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      notes: b.notes,
      totalAmount: Number(b.totalAmount),
      items: b.items.map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        inventoryItemName: item.inventoryItem.name,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalPrice: Number(item.totalPrice),
      })),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return { success: true, batches: formatted };
  } catch (error) {
    console.error("Error fetching stock intake batches:", error);
    return {
      success: false,
      error: "Failed to fetch stock intake batches",
      batches: [],
    };
  }
}

export async function createStockIntakeBatch(data: {
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitCost: number;
  }>;
}) {
  try {
    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: "At least one item is required for restock batch",
      };
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const batchNumber = `INTAKE-${dateStr}-${randomSuffix}`;

    let totalAmount = 0;
    data.items.forEach((item) => {
      totalAmount += item.quantity * item.unitCost;
    });

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.stockIntakeBatch.create({
        data: {
          batchNumber,
          notes: data.notes?.trim() || null,
          totalAmount,
          items: {
            create: data.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalPrice: item.quantity * item.unitCost,
            })),
          },
        },
      });

      for (const item of data.items) {
        const currentItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (currentItem) {
          const prevQty = Number(currentItem.quantity);
          const newQty = prevQty + item.quantity;

          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              quantity: newQty,
              unitCost: item.unitCost,
            },
          });

          await tx.stockMovement.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              type: StockMovementType.PURCHASE_IN,
              quantityChange: item.quantity,
              previousQuantity: prevQty,
              newQuantity: newQty,
              reason: `Restock Batch ${batchNumber}${data.notes ? ` (${data.notes})` : ""}`,
            },
          });
        }
      }

      return batch;
    });

    revalidatePath("/admin/inventory");
    return {
      success: true,
      batchId: result.id,
      batchNumber: result.batchNumber,
    };
  } catch (error) {
    console.error("Error creating stock intake batch:", error);
    return { success: false, error: "Failed to record stock intake batch" };
  }
}

// ----------------------------------------------------
// AUTOMATED COOKING INVENTORY DEDUCTION (PREPARING Status)
// ----------------------------------------------------

export async function deductInventoryForOrder(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order || !order.items || order.items.length === 0)
      return { success: true };

    // Map to aggregate deduction totals: inventoryItemId -> { totalRequired: number, reasons: string[] }
    const deductionsMap: Record<
      string,
      { totalRequired: number; reasons: string[] }
    > = {};

    // Collect all add-on IDs across all order items to fetch add-on recipes in bulk
    const addOnIdsSet = new Set<string>();
    for (const orderItem of order.items) {
      if (orderItem.addOns) {
        try {
          const parsedAddOns = JSON.parse(orderItem.addOns) as Array<{
            id?: string;
          }>;
          if (Array.isArray(parsedAddOns)) {
            parsedAddOns.forEach((a) => {
              if (a.id) addOnIdsSet.add(a.id);
            });
          }
        } catch {
          // ignore parse error if string
        }
      }
    }

    let addOnRecords: Array<{ id: string; ingredients: Prisma.JsonValue }> = [];
    if (addOnIdsSet.size > 0) {
      addOnRecords = await prisma.addOn.findMany({
        where: { id: { in: Array.from(addOnIdsSet) } },
        select: { id: true, ingredients: true },
      });
    }
    const addOnMap = new Map(addOnRecords.map((a) => [a.id, a.ingredients]));

    for (const orderItem of order.items) {
      const itemQty = orderItem.quantity;
      const orderRef = order.kotNumber
        ? `KOT-${order.kotNumber}`
        : order.orderNumber;

      // 1. Food Item Ingredients
      if (orderItem.menuItem && orderItem.menuItem.ingredients) {
        const itemIngredients = orderItem.menuItem
          .ingredients as unknown as Array<{
          inventoryItemId: string;
          quantityRequired: number;
        }>;

        if (Array.isArray(itemIngredients)) {
          for (const ing of itemIngredients) {
            if (!ing.inventoryItemId || !ing.quantityRequired) continue;
            const req = Number(ing.quantityRequired) * itemQty;
            if (!deductionsMap[ing.inventoryItemId]) {
              deductionsMap[ing.inventoryItemId] = {
                totalRequired: 0,
                reasons: [],
              };
            }
            deductionsMap[ing.inventoryItemId].totalRequired += req;
            deductionsMap[ing.inventoryItemId].reasons.push(
              `${orderRef}: ${orderItem.itemName} x${itemQty}`,
            );
          }
        }
      }

      // 2. Add-on Ingredients
      if (orderItem.addOns) {
        try {
          const parsedAddOns = JSON.parse(orderItem.addOns) as Array<{
            id?: string;
            name?: string;
          }>;
          if (Array.isArray(parsedAddOns)) {
            for (const addOnObj of parsedAddOns) {
              if (!addOnObj.id) continue;
              const rawIngredients = addOnMap.get(addOnObj.id);
              if (!rawIngredients) continue;

              const addOnIngredients = rawIngredients as unknown as Array<{
                inventoryItemId: string;
                quantityRequired: number;
              }>;

              if (Array.isArray(addOnIngredients)) {
                for (const ing of addOnIngredients) {
                  if (!ing.inventoryItemId || !ing.quantityRequired) continue;
                  const req = Number(ing.quantityRequired) * itemQty;
                  if (!deductionsMap[ing.inventoryItemId]) {
                    deductionsMap[ing.inventoryItemId] = {
                      totalRequired: 0,
                      reasons: [],
                    };
                  }
                  deductionsMap[ing.inventoryItemId].totalRequired += req;
                  deductionsMap[ing.inventoryItemId].reasons.push(
                    `${orderRef}: AddOn (${addOnObj.name || "Extra"}) x${itemQty}`,
                  );
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }

    const inventoryItemIds = Object.keys(deductionsMap);
    if (inventoryItemIds.length === 0) return { success: true };

    await prisma.$transaction(async (tx) => {
      for (const invId of inventoryItemIds) {
        const data = deductionsMap[invId];
        const invItem = await tx.inventoryItem.findUnique({
          where: { id: invId },
        });

        if (invItem) {
          const prevQty = Number(invItem.quantity);
          const newQty = Math.max(0, prevQty - data.totalRequired);

          await tx.inventoryItem.update({
            where: { id: invId },
            data: { quantity: newQty },
          });

          await tx.stockMovement.create({
            data: {
              inventoryItemId: invId,
              type: StockMovementType.SALE_DEDUCTION,
              quantityChange: -data.totalRequired,
              previousQuantity: prevQty,
              newQuantity: newQty,
              reason: `Cooking Order: ${data.reasons.join(", ")}`,
            },
          });
        }
      }
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deducting inventory for order:", error);
    return { success: false, error: "Failed to deduct inventory for order" };
  }
}
