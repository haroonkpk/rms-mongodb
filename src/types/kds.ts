export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface KitchenAddOnItem {
  id?: string;
  name: string;
  price?: number;
}

export interface KitchenOrderItem {
  id: string;
  orderId: string;
  menuItemId: string | null;
  itemName: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addOns: KitchenAddOnItem[];
  notes: string | null;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  kotNumber: number | null;
  cashierId: string | null;
  cashierName: string | null;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  totalAmount: number;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  items: KitchenOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface KitchenStats {
  totalActive: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  completedTodayCount: number;
}

export interface KitchenOrdersResponse {
  success: boolean;
  orders: KitchenOrder[];
  stats: KitchenStats;
  error?: string;
}