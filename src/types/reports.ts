import type { InventoryUnit, StockMovementType } from "../../prisma/generated";

export type ReportPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
export type ReportTab =
  | "sales"
  | "menu"
  | "expenses"
  | "inventory"
  | "payroll"
  | "operations"
  | "profit-loss";

export interface DateRangeFilter {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ReportFilters extends DateRangeFilter {
  cashierId?: string;
  paymentMethod?: string;
  orderType?: string;
  orderStatus?: string;
  expenseType?: string;
  movementType?: string;
  employeeId?: string;
}

export interface TrendPoint {
  label: string;
  amount: number;
  count: number;
}

export interface TrendChartPoint {
  label: string;
  [key: string]: string | number;
}

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

export interface BreakdownPoint {
  label: string;
  amount: number;
  count: number;
}

export interface ReportInventoryMovement {
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

export interface DashboardData {
  range: { start: string; end: string };
  kpis: {
    sales: number;
    orders: number;
    averageOrder: number;
    outstanding: number;
    expenses: number;
    operatingResult: number;
  };
  salesTrend: TrendPoint[];
  paymentMix: BreakdownPoint[];
  orderStatus: BreakdownPoint[];
  topItems: BreakdownPoint[];
  alerts: Array<{
    label: string;
    value: number;
    tone: "danger" | "warning" | "info";
  }>;
  stock: {
    low: Array<{ id: string; name: string; quantity: number; unit: string }>;
    out: Array<{ id: string; name: string; quantity: number; unit: string }>;
  };
  latestCompletedOrders: Array<{
    id: string;
    orderNumber: string;
    amount: number;
    createdAt: string;
  }>;
  workforce: { present: number; absent: number; payrollOutstanding: number };
  recentExpenses: Array<{
    id: string;
    title: string;
    type: string;
    amount: number;
    date: string;
  }>;
}

export interface ReportData {
  tab: ReportTab;
  range: { start: string; end: string };
  kpis: Array<{ label: string; value: number; detail?: string }>;
  trend: TrendPoint[];
  trendSeries?: {
    data: TrendChartPoint[];
    series: TrendSeries[];
  };
  breakdown: BreakdownPoint[];
  inventoryMovements?: ReportInventoryMovement[];
  rows: Array<Record<string, string | number>>;
}
