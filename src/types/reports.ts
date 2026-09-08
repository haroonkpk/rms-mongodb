export type ReportPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
export type ReportTab =
  | "sales"
  | "menu"
  | "expenses"
  | "inventory"
  | "payroll"
  | "operations";

export interface DateRangeFilter {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ReportFilters extends DateRangeFilter {
  cashierId?: string;
  paymentMethod?: string;
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

export interface BreakdownPoint {
  label: string;
  amount: number;
  count: number;
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
  breakdown: BreakdownPoint[];
  rows: Array<Record<string, string | number>>;
}
