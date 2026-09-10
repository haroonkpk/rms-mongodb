import { ReportDetailTable } from "@/components/admin/reports/report-detail-table";
import { ReportTrendChart } from "@/components/admin/reports/report-trend-chart";
import { ReportKpiGrid } from "@/components/ui/report-kpi-grid";
import { ReportTableTabProps } from "./report-tab-types";

export function MenuReportTab({
  data,
  label,
  trendValueLabel,
  isLoading,
}: ReportTableTabProps) {
  return (
    <>
      <ReportKpiGrid data={data} label={label} isLoading={isLoading} />
      <div className=" flex overflow-auto ">
        <ReportTrendChart
          data={data.trend}
          title={`${label} sold quantity trend`}
          valueLabel={trendValueLabel || "Items sold"}
          valueFormat="quantity"
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
