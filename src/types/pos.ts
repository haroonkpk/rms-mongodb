export interface POSAddOn {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface POSItemSize {
  name: string;
  price: number;
}

export interface POSVariant {
  name: string;
  priceOffset: number;
}

export interface POSMenuItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
  hasSizes: boolean;
  sizes: POSItemSize[];
  variants?: POSVariant[];
  addOns: POSAddOn[];
}

export interface POSCategory {
  id: string;
  name: string;
  itemCount: number;
}

export interface CartAddOnItem {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  itemId: string;
  name: string;
  basePrice: number;
  variant?: POSVariant;
  addOns: CartAddOnItem[];
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  notes?: string;
  imageUrl?: string | null;
}

export interface POSOrderPayload {
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: "CASH" | "QR_CODE" | "LEDGER";
  paymentStatus?: "PAID" | "UNPAID";
  cashReceived?: number;
  changeGiven?: number;
  dueAmount?: number;
  customerName?: string;
  customerPhone?: string;
  status?: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export interface POSCashierInfo {
  id?: string;
  fullName?: string | null;
  email: string;
  role?: string;
  shiftTiming?: string | null;
}

export interface POSInitDataResponse {
  success: boolean;
  error?: string;
  cashier: POSCashierInfo | null;
  shiftStartTime?: string;
  categories: POSCategory[];
  menuItems: POSMenuItem[];
}

export interface POSOrderResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
  kotNumber?: number | null;
  orderId?: string | null;
  createdAt?: string;
  cashierName?: string;
  payload?: POSOrderPayload;
}
