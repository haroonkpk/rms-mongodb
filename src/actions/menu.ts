'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface CategoryData {
  id: string
  name: string
  description: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface AddOnData {
  id: string
  name: string
  price: number
  isAvailable: boolean
  menuItemId: string | null
  menuItemName?: string | null
  createdAt: string
  updatedAt: string
}

export interface MenuItemData {
  id: string
  name: string
  description: string | null
  basePrice: number
  imageUrl: string | null
  isAvailable: boolean
  categoryId: string
  categoryName: string
  addOns: AddOnData[]
  createdAt: string
  updatedAt: string
}

// ----------------------------------------------------
// CATEGORIES ACTIONS
// ----------------------------------------------------

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    })

    const formatted: CategoryData[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      itemCount: cat._count.menuItems,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }))

    return { success: true, categories: formatted }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories', categories: [] }
  }
}

export async function createCategory(name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Category name is required' }
    }

    const existing = await prisma.category.findUnique({
      where: { name: trimmedName },
    })

    if (existing) {
      return { success: false, error: 'Category with this name already exists' }
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        description: description?.trim() || null,
      },
    })

    revalidatePath('/admin/menu')
    return { success: true, categoryId: category.id }
  } catch (error) {
    console.error('Error creating category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(id: string, name: string, description?: string) {
  try {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Category name is required' }
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: trimmedName,
        NOT: { id },
      },
    })

    if (existing) {
      return { success: false, error: 'Another category with this name already exists' }
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        description: description?.trim() || null,
      },
    })

    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error updating category:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } })
    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category. Make sure it has no attached items.' }
  }
}

// ----------------------------------------------------
// MENU ITEMS ACTIONS
// ----------------------------------------------------

export async function getMenuItems(
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  categoryId: string = 'ALL',
  isAvailableFilter?: boolean
) {
  try {
    const skip = (page - 1) * pageSize

    // Build where clause
    const whereConditions: Array<Record<string, unknown>> = []

    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      })
    }

    if (categoryId && categoryId !== 'ALL') {
      whereConditions.push({ categoryId })
    }

    if (typeof isAvailableFilter === 'boolean') {
      whereConditions.push({ isAvailable: isAvailableFilter })
    }

    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {}

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          category: true,
          addOns: true,
        },
      }),
      prisma.menuItem.count({ where: whereClause }),
    ])

    const formatted: MenuItemData[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      basePrice: Number(item.basePrice),
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      addOns: item.addOns.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price),
        isAvailable: addon.isAvailable,
        menuItemId: addon.menuItemId,
        createdAt: addon.createdAt.toISOString(),
        updatedAt: addon.updatedAt.toISOString(),
      })),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))

    return {
      success: true,
      items: formatted,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return { success: false, error: 'Failed to fetch menu items', items: [], total: 0, totalPages: 1 }
  }
}

export async function createMenuItem(data: {
  name: string
  description?: string
  basePrice: number
  categoryId: string
  imageUrl?: string
  isAvailable?: boolean
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'Item name is required' }
    }
    if (!data.categoryId) {
      return { success: false, error: 'Category is required' }
    }
    if (data.basePrice === undefined || data.basePrice < 0) {
      return { success: false, error: 'Valid base price is required' }
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        basePrice: data.basePrice,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable ?? true,
      },
    })

    revalidatePath('/admin/menu')
    return { success: true, itemId: newItem.id }
  } catch (error) {
    console.error('Error creating menu item:', error)
    return { success: false, error: 'Failed to create menu item' }
  }
}

export async function updateMenuItem(
  id: string,
  data: {
    name: string
    description?: string
    basePrice: number
    categoryId: string
    imageUrl?: string
    isAvailable?: boolean
  }
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'Item name is required' }
    }
    if (!data.categoryId) {
      return { success: false, error: 'Category is required' }
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
      },
    })

    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error updating menu item:', error)
    return { success: false, error: 'Failed to update menu item' }
  }
}

export async function toggleMenuItemAvailability(id: string, isAvailable?: boolean) {
  try {
    let targetState = isAvailable

    if (targetState === undefined) {
      const current = await prisma.menuItem.findUnique({
        where: { id },
        select: { isAvailable: true },
      })
      targetState = !(current?.isAvailable ?? false)
    }

    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: targetState },
    })

    revalidatePath('/admin/menu')
    return { success: true, isAvailable: targetState }
  } catch (error) {
    console.error('Error toggling menu item availability:', error)
    return { success: false, error: 'Failed to update stock availability' }
  }
}

export async function deleteMenuItem(id: string) {
  try {
    await prisma.menuItem.delete({ where: { id } })
    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return { success: false, error: 'Failed to delete menu item' }
  }
}

// ----------------------------------------------------
// ADD-ONS & MODIFIERS ACTIONS
// ----------------------------------------------------

export async function getAddOns() {
  try {
    const addOns = await prisma.addOn.findMany({
      orderBy: { name: 'asc' },
      include: {
        menuItem: {
          select: { name: true },
        },
      },
    })

    const formatted: AddOnData[] = addOns.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: Number(addon.price),
      isAvailable: addon.isAvailable,
      menuItemId: addon.menuItemId,
      menuItemName: addon.menuItem?.name || 'All Items (Global)',
      createdAt: addon.createdAt.toISOString(),
      updatedAt: addon.updatedAt.toISOString(),
    }))

    return { success: true, addOns: formatted }
  } catch (error) {
    console.error('Error fetching add-ons:', error)
    return { success: false, error: 'Failed to fetch add-ons', addOns: [] }
  }
}

export async function createAddOn(data: {
  name: string
  price: number
  menuItemId?: string | null
  isAvailable?: boolean
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'Add-on name is required' }
    }
    if (data.price === undefined || data.price < 0) {
      return { success: false, error: 'Valid price is required' }
    }

    const addOn = await prisma.addOn.create({
      data: {
        name: data.name.trim(),
        price: data.price,
        menuItemId: data.menuItemId || null,
        isAvailable: data.isAvailable ?? true,
      },
    })

    revalidatePath('/admin/menu')
    return { success: true, addOnId: addOn.id }
  } catch (error) {
    console.error('Error creating add-on:', error)
    return { success: false, error: 'Failed to create add-on' }
  }
}

export async function updateAddOn(
  id: string,
  data: {
    name: string
    price: number
    menuItemId?: string | null
    isAvailable?: boolean
  }
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'Add-on name is required' }
    }

    await prisma.addOn.update({
      where: { id },
      data: {
        name: data.name.trim(),
        price: data.price,
        menuItemId: data.menuItemId || null,
        isAvailable: data.isAvailable ?? true,
      },
    })

    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error updating add-on:', error)
    return { success: false, error: 'Failed to update add-on' }
  }
}

export async function toggleAddOnAvailability(id: string, isAvailable?: boolean) {
  try {
    let targetState = isAvailable

    if (targetState === undefined) {
      const current = await prisma.addOn.findUnique({
        where: { id },
        select: { isAvailable: true },
      })
      targetState = !(current?.isAvailable ?? false)
    }

    await prisma.addOn.update({
      where: { id },
      data: { isAvailable: targetState },
    })

    revalidatePath('/admin/menu')
    return { success: true, isAvailable: targetState }
  } catch (error) {
    console.error('Error toggling add-on availability:', error)
    return { success: false, error: 'Failed to update add-on availability' }
  }
}

export async function deleteAddOn(id: string) {
  try {
    await prisma.addOn.delete({ where: { id } })
    revalidatePath('/admin/menu')
    return { success: true }
  } catch (error) {
    console.error('Error deleting add-on:', error)
    return { success: false, error: 'Failed to delete add-on' }
  }
}
