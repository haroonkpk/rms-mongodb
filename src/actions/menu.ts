"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "../../prisma/generated";
import { isMenuItemAvailable } from "@/lib/menu-availability";

export interface MenuItemSize {
  name: string;
  price: number;
}

export interface CategoryData {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  quantityRequired: number;
}

export interface AddOnData {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  ingredients?: RecipeIngredient[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isAvailable: boolean;
  hasSizes: boolean;
  sizes: MenuItemSize[] | null;
  categoryId: string;
  categoryName: string;
  addOns: AddOnData[];
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  basePrice: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable?: boolean;
  hasSizes?: boolean;
  sizes?: MenuItemSize[];
  addOnIds?: string[];
  ingredients?: RecipeIngredient[];
}

// ----------------------------------------------------
// CATEGORIES ACTIONS
// ----------------------------------------------------

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    const formatted: CategoryData[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      itemCount: cat._count.menuItems,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));

    return { success: true, categories: formatted };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      categories: [],
    };
  }
}

export async function createCategory(name: string) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    const existing = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return {
        success: false,
        error: "Category with this name already exists",
      };
    }

    const category = await prisma.category.create({
      data: { name: trimmedName },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true, categoryId: category.id };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    const existing = await prisma.category.findFirst({
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

    await prisma.category.update({
      where: { id },
      data: { name: trimmedName },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error:
        "Failed to delete category. Make sure it has no linked food items.",
    };
  }
}

// ----------------------------------------------------
// MENU FOOD ITEMS ACTIONS
// ----------------------------------------------------

export async function getMenuItems(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  categoryId: string = "ALL",
  isAvailable?: boolean,
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

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        addOns: true,
      },
    });

    const inventoryItemIds = items.flatMap((item) => {
      if (!Array.isArray(item.ingredients)) return [];
      return item.ingredients.flatMap((ingredient) => {
        if (!ingredient || typeof ingredient !== "object") return [];
        const inventoryItemId = (ingredient as { inventoryItemId?: unknown })
          .inventoryItemId;
        return typeof inventoryItemId === "string" ? [inventoryItemId] : [];
      });
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

    const formattedItems: MenuItemData[] = items.map((item) => {
      let parsedSizes: MenuItemSize[] | null = null;
      if (item.hasSizes && item.sizes) {
        parsedSizes = item.sizes as unknown as MenuItemSize[];
      }

      let parsedIngredients: RecipeIngredient[] = [];
      if (item.ingredients) {
        parsedIngredients = item.ingredients as unknown as RecipeIngredient[];
      }

      return {
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
        hasSizes: item.hasSizes,
        sizes: parsedSizes,
        categoryId: item.categoryId,
        categoryName: item.category.name,
        addOns: item.addOns.map((a) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price),
          isAvailable: a.isAvailable,
          ingredients: a.ingredients
            ? (a.ingredients as unknown as RecipeIngredient[])
            : [],
        })),
        ingredients: parsedIngredients,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });
    const filteredItems =
      isAvailable === undefined
        ? formattedItems
        : formattedItems.filter((item) => item.isAvailable === isAvailable);
    const paginatedItems = filteredItems.slice(skip, skip + pageSize);

    return {
      success: true,
      items: paginatedItems,
      total: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / pageSize) || 1,
    };
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return {
      success: false,
      error: "Failed to fetch menu items",
      items: [],
      total: 0,
      totalPages: 1,
    };
  }
}

export async function createMenuItem(data: CreateMenuItemInput) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Item name is required" };
    }
    if (!data.categoryId) {
      return { success: false, error: "Category is required" };
    }
    if (data.basePrice === undefined || data.basePrice < 0) {
      return { success: false, error: "Valid base price is required" };
    }

    const item = await prisma.menuItem.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        basePrice: data.basePrice,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable ?? true,
        hasSizes: data.hasSizes ?? false,
        sizes:
          data.hasSizes && data.sizes
            ? (data.sizes as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        ingredients:
          data.ingredients && data.ingredients.length > 0
            ? (data.ingredients as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        addOns: {
          connect: data.addOnIds ? data.addOnIds.map((id) => ({ id })) : [],
        },
      },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true, itemId: item.id };
  } catch (error) {
    console.error("Error creating menu item:", error);
    return { success: false, error: "Failed to create menu item" };
  }
}

export async function updateMenuItem(id: string, data: CreateMenuItemInput) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Item name is required" };
    }
    if (!data.categoryId) {
      return { success: false, error: "Category is required" };
    }

    await prisma.menuItem.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        basePrice: data.basePrice,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable ?? true,
        hasSizes: data.hasSizes ?? false,
        sizes:
          data.hasSizes && data.sizes
            ? (data.sizes as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        ingredients:
          data.ingredients && data.ingredients.length > 0
            ? (data.ingredients as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        addOns: {
          set: data.addOnIds ? data.addOnIds.map((id) => ({ id })) : [],
        },
      },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error updating menu item:", error);
    return { success: false, error: "Failed to update menu item" };
  }
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable?: boolean,
) {
  try {
    let targetState = isAvailable;

    if (targetState === undefined) {
      const current = await prisma.menuItem.findUnique({
        where: { id },
        select: { isAvailable: true },
      });
      targetState = !(current?.isAvailable ?? false);
    }

    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: targetState },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true, isAvailable: targetState };
  } catch (error) {
    console.error("Error toggling menu item availability:", error);
    return { success: false, error: "Failed to update stock availability" };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return { success: false, error: "Failed to delete menu item" };
  }
}

// ----------------------------------------------------
// ADD-ONS & MODIFIERS ACTIONS
// ----------------------------------------------------

export async function getAddOns() {
  try {
    const addOns = await prisma.addOn.findMany({
      orderBy: { name: "asc" },
    });

    const formatted: AddOnData[] = addOns.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
      isAvailable: addon.isAvailable,
      ingredients: addon.ingredients
        ? (addon.ingredients as unknown as RecipeIngredient[])
        : [],
      createdAt: addon.createdAt.toISOString(),
      updatedAt: addon.updatedAt.toISOString(),
    }));

    return { success: true, addOns: formatted };
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return { success: false, error: "Failed to fetch add-ons", addOns: [] };
  }
}

export async function createAddOn(data: {
  name: string;
  price: number;
  isAvailable?: boolean;
  ingredients?: RecipeIngredient[];
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Add-on name is required" };
    }
    if (data.price === undefined || data.price < 0) {
      return { success: false, error: "Valid price is required" };
    }

    const addon = await prisma.addOn.create({
      data: {
        name: data.name.trim(),
        price: data.price,
        isAvailable: data.isAvailable ?? true,
        ingredients:
          data.ingredients && data.ingredients.length > 0
            ? (data.ingredients as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true, addOnId: addon.id };
  } catch (error) {
    console.error("Error creating add-on:", error);
    return { success: false, error: "Failed to create add-on" };
  }
}

export async function updateAddOn(
  id: string,
  data: {
    name: string;
    price: number;
    isAvailable?: boolean;
    ingredients?: RecipeIngredient[];
  },
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "Add-on name is required" };
    }
    if (data.price === undefined || data.price < 0) {
      return { success: false, error: "Valid price is required" };
    }

    await prisma.addOn.update({
      where: { id },
      data: {
        name: data.name.trim(),
        price: data.price,
        isAvailable: data.isAvailable ?? true,
        ingredients:
          data.ingredients && data.ingredients.length > 0
            ? (data.ingredients as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error updating add-on:", error);
    return { success: false, error: "Failed to update add-on" };
  }
}

export async function toggleAddOnAvailability(
  id: string,
  isAvailable?: boolean,
) {
  try {
    let targetState = isAvailable;

    if (targetState === undefined) {
      const current = await prisma.addOn.findUnique({
        where: { id },
        select: { isAvailable: true },
      });
      targetState = !(current?.isAvailable ?? false);
    }

    await prisma.addOn.update({
      where: { id },
      data: { isAvailable: targetState },
    });

    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true, isAvailable: targetState };
  } catch (error) {
    console.error("Error toggling add-on availability:", error);
    return { success: false, error: "Failed to update add-on availability" };
  }
}

export async function deleteAddOn(id: string) {
  try {
    await prisma.addOn.delete({ where: { id } });
    revalidatePath("/admin/menu");
    revalidatePath("/pos");
    revalidateTag("pos-data", "max");
    return { success: true };
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return { success: false, error: "Failed to delete add-on" };
  }
}
