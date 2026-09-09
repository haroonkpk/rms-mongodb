import { StockMovementsTable } from "@/components/admin/inventory/stock-movements-table";
import { ReportBreakdownChart } from "@/components/admin/reports/report-breakdown-chart";
import { ReportTrendChart } from "@/components/admin/reports/report-trend-chart";
import { ReportKpiGrid } from "@/components/ui/report-kpi-grid";
import { ReportInventoryMovement } from "@/types/reports";
import { ReportData } from "@/types/reports";

interface InventoryReportTabProps {
  data: ReportData;
  label: string;
  trendValueLabel: string;
  movements: ReportInventoryMovement[];
  allMovements: ReportInventoryMovement[];
  movementTypeFilter: string;
  onMovementTypeFilterChange: (type: string) => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function InventoryReportTab({
  data,
  label,
  trendValueLabel,
  movements,
  allMovements,
  movementTypeFilter,
  onMovementTypeFilterChange,
  currentPage,
  totalPages,
  totalEntries,
  isLoading,
  onPageChange,
}: InventoryReportTabProps) {
  const movementTotals = new Map([
    ["SALE_DEDUCTION", { label: "Sold", amount: 0, count: 0 }],
    ["WASTAGE_OUT", { label: "Wasted", amount: 0, count: 0 }],
    ["SPOILAGE_OUT", { label: "Expired", amount: 0, count: 0 }],
  ]);
  allMovements.forEach((movement) => {
    const total = movementTotals.get(movement.type);
    if (!total) return;
    total.amount += Math.abs(movement.quantityChange);
    total.count += 1;
  });
  const sold = movementTotals.get("SALE_DEDUCTION")!;
  const wastedAndExpired = movementTotals.get("WASTAGE_OUT")!;
  const expired = movementTotals.get("SPOILAGE_OUT")!;
  const chartData = {
    ...data,
    breakdown: [
      sold,
      {
        label: "Wasted + Expired",
        amount: wastedAndExpired.amount + expired.amount,
        count: wastedAndExpired.count + expired.count,
      },
    ].filter((item) => item.amount > 0),
  };

  return (
    <>
      <ReportKpiGrid data={data} label={label} isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <ReportBreakdownChart
          data={chartData.breakdown}
          title={`${label} breakdown`}
          valueFormat="quantity"
          isLoading={isLoading}
        />
      </div>
      <StockMovementsTable
        movements={movements}
        pdfMovements={allMovements}
        movementTypeFilter={movementTypeFilter}
        onMovementTypeFilterChange={onMovementTypeFilterChange}
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        isLoading={isLoading}
        onPageChange={onPageChange}
      />
    </>
  );
}
