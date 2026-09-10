import { ReportDetailTable } from "@/components/admin/reports/report-detail-table";
import { ReportKpiGrid } from "@/components/ui/report-kpi-grid";
import { ReportTableTabProps } from "./report-tab-types";

export function PayrollReportTab({
  data,
  label,
  isLoading,
}: ReportTableTabProps) {
  return (
    <>
      <ReportKpiGrid data={data} label={label} isLoading={isLoading} />
      <ReportDetailTable
        heading="Payroll payments"
        rows={data.rows}
        isLoading={isLoading}
      />
    </>
  );
}
