'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/actions/auth'
import { revalidatePath } from 'next/cache'
import {
  POSAddOn,
  POSMenuItem,
  POSCategory,
  POSOrderPayload,
  POSInitDataResponse,
  POSOrderResult,
} from '@/types/pos'

export async function getPOSInitData(): Promise<POSInitDataResponse> {
  try {
    const user = await getCurrentUser()

    const now = new Date()
    const shiftStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0)
    const formattedShiftTime = shiftStartTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    // Real DB Categories
    const dbCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    })

    // Real DB Menu Items
    const dbMenuItems = await prisma.menuItem.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: true,
        addOns: true,
      },
    })

    const categories: POSCategory[] = dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.menuItems,
    }))

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
      sizes: Array.isArray(item.sizes) ? (item.sizes as unknown as { name: string; price: number }[]) : [],
      addOns: item.addOns.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: Number(addon.price),
        isAvailable: addon.isAvailable,
      })),
    }))

    return {
      success: true,
      cashier: user || null,
      shiftStartTime: formattedShiftTime,
      categories,
      menuItems,
    }
  } catch (error) {
    console.error('Error fetching POS init data:', error)
    return {
      success: false,
      error: 'Failed to load POS data',
      cashier: null,
      shiftStartTime: '08:00 AM',
      categories: [],
      menuItems: [],
    }
  }
}

export async function createPOSOrder(payload: POSOrderPayload): Promise<POSOrderResult> {
  try {
    const user = await getCurrentUser()
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Bill is empty' }
    }

    let savedOrderId = null
    try {
      const dbOrder = await prisma.order.create({
        data: {
          orderNumber,
          cashierId: user?.id || null,
          status: 'COMPLETED',
          paymentMethod: payload.paymentMethod,
          subtotal: payload.subtotal,
          tax: 0,
          discount: 0,
          totalAmount: payload.totalAmount,
          cashReceived: payload.cashReceived || null,
          changeGiven: payload.changeGiven || null,
          notes: payload.notes || null,
          items: {
            create: payload.items.map((item) => ({
              menuItemId: item.itemId.startsWith('item-') ? null : item.itemId,
              itemName: item.name,
              variant: item.variant?.name || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.itemTotal,
              addOns: item.addOns.length > 0 ? JSON.stringify(item.addOns) : null,
              notes: item.notes || null,
            })),
          },
        },
      })
      savedOrderId = dbOrder.id
    } catch (err) {
      console.warn('DB order insertion warning:', err)
    }

    revalidatePath('/pos')

    return {
      success: true,
      orderNumber,
      orderId: savedOrderId,
      createdAt: new Date().toLocaleString(),
      cashierName: user?.fullName || user?.email?.split('@')[0] || 'Cashier Staff',
      payload,
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Failed to process order. Please try again.' }
  }
}
