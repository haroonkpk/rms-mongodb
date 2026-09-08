"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  FileText,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getReportData } from "@/actions/reports";
import { ReportData, ReportFilters, ReportTab } from "@/types/reports";
import { ReportBreakdownChart } from "@/components/admin/reports/report-breakdown-chart";
import { ReportDetailTable } from "@/components/admin/reports/report-detail-table";
import { ReportTrendChart } from "@/components/admin/reports/report-trend-chart";

const tabs: Array<{
  id: ReportTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: "sales", label: "Sales", icon: CircleDollarSign },
  { id: "menu", label: "Menu Performance", icon: BarChart3 },
  { id: "expenses", label: "Expenses", icon: WalletCards },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "payroll", label: "Payroll", icon: ClipboardList },
  { id: "operations", label: "Operations", icon: FileText },
];
const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;
const empty: ReportData = {
  tab: "sales",
  range: { start: "", end: "" },
  kpis: [],
  trend: [],
  breakdown: [],
  rows: [],
};

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("sales");
  const [filters, setFilters] = useState<ReportFilters>({
    period: "THIS_MONTH",
    paymentMethod: "ALL",
    orderStatus: "ALL",
    expenseType: "ALL",
    movementType: "ALL",
  });
  const [data, setData] = useState<ReportData>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const load = async () => {
    setIsLoading(true);
    try {
      setData(await getReportData(tab, filters));
    } finally {
      setIsLoading(false);
    }
  };
  // The loader intentionally captures the active filter snapshot for this request.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [
    tab,
    filters.period,
    filters.paymentMethod,
    filters.orderStatus,
    filters.expenseType,
    filters.movementType,
    filters.employeeId,
    filters.startDate,
    filters.endDate,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const update = (key: keyof ReportFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Reports & Analytics" />
      <main className="mt-4 flex flex-col gap-6">
        <div className="flex items-center justify-end ">
          <div className="flex flex-wrap items-end gap-3 w-fit max-w-xs  border border-slate-200 bg-white p-4 shadow-2xs">
            <Select
              label="Period"
              value={filters.period}
              onChange={(event) => update("period", event.target.value)}
              options={[
                { value: "THIS_MONTH", label: "This Month" },
                { value: "CUSTOM", label: "Custom range" },
              ]}
            />
            {filters.period === "CUSTOM" && (
              <>
                <Input
                  label="From"
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) => update("startDate", event.target.value)}
                />
                <Input
                  label="To"
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(event) => update("endDate", event.target.value)}
                />
              </>
            )}
            <Button
              variant="outline"
              icon={<RefreshCw size={16} />}
              onClick={() => void load()}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 border px-4 py-3 text-sm font-semibold transition ${tab === id ? "border-(--color-primary) bg-(--color-primary) text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className="border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {typeof kpi.value === "number" ? money(kpi.value) : kpi.value}
              </p>
              {kpi.detail && (
                <p className="mt-1 text-xs text-slate-500">{kpi.detail}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
          <ReportTrendChart data={data.trend} />
          <ReportBreakdownChart data={data.breakdown} />
        </div>

        {/* Detail Table */}
        <ReportDetailTable
          heading={`${tabs.find((item) => item.id === tab)?.label} detail`}
          rows={data.rows}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
