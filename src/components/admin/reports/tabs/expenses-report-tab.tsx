import { ReportDetailTable } from "@/components/admin/reports/report-detail-table";
import { ReportTrendChart } from "@/components/admin/reports/report-trend-chart";
import { ReportKpiGrid } from "@/components/ui/report-kpi-grid";
import { ReportTableTabProps } from "./report-tab-types";

export function ExpensesReportTab({
  data,
  label,
  trendValueLabel,
  isLoading,
}: ReportTableTabProps) {
  return (
    <>
      <ReportKpiGrid data={data} label={label} isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <ReportTrendChart
          data={data.trend}
          title="Expense Types trend"
          valueLabel={trendValueLabel}
          seriesData={data.trendSeries?.data}
          series={data.trendSeries?.series}
          isLoading={isLoading}
        />
      </div>
      <ReportDetailTable
        heading={`${label} detail`}
        rows={data.rows}
        isLoading={isLoading}
      />
    </>
  );
}
