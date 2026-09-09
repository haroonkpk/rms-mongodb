import { Card } from "@/components/ui/card";
import { ReportData } from "@/types/reports";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;
const countLabels = new Set([
  "Orders",
  "Outstanding orders",
  "Entries",
  "Items sold",
  "Best sellers",
  "Total orders",
  "Completed",
  "Active queue",
  "Low stock",
  "Out of stock",
  "Sold items",
  "Wasted items",
  "Expired items",
  "Wasted + expired items",
  "Paid employees",
]);

function formatKpiValue(label: string, value: number | string) {
  if (typeof value !== "number") return value;
  if (label === "Margin") return `${value.toFixed(1)}%`;
  if (countLabels.has(label)) return Math.round(value).toLocaleString();
  return money(value);
}

export function ReportKpiGrid({
  data,
  label,
  isLoading = false,
}: {
  data: ReportData;
  label: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="border border-slate-200 bg-white p-5 shadow-2xs"
          >
            <div className="h-3 w-24 animate-pulse rounded-sm bg-slate-200" />
            <div className="mt-3 h-8 w-32 animate-pulse rounded-sm bg-slate-200" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded-sm bg-slate-100" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={`border bg-white p-5 shadow-2xs ${label === "Profit & Loss" && kpi.label === "Profit" ? "border-emerald-200 bg-emerald-50/60" : label === "Profit & Loss" && kpi.label === "Loss" ? "border-rose-200 bg-rose-50/60" : "border-slate-200"}`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wide ${label === "Profit & Loss" && kpi.label === "Profit" ? "text-emerald-700" : label === "Profit & Loss" && kpi.label === "Loss" ? "text-rose-700" : "text-slate-500"}`}
          >
            {kpi.label}
          </p>
          <p
            className={`mt-2 text-2xl font-black ${label === "Profit & Loss" && kpi.label === "Profit" ? "text-emerald-800" : label === "Profit & Loss" && kpi.label === "Loss" ? "text-rose-800" : "text-slate-900"}`}
          >
            {formatKpiValue(kpi.label, kpi.value)}
          </p>
          {kpi.detail && (
            <p className="mt-1 text-xs text-slate-500">{kpi.detail}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
