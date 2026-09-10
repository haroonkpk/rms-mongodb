"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Filter,
  WalletCards,
  Scale,
  X,
} from "lucide-react";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getReportData } from "@/actions/reports";
import { ReportData, ReportFilters, ReportTab } from "@/types/reports";
import { SalesReportTab } from "@/components/admin/reports/tabs/sales-report-tab";
import { MenuReportTab } from "@/components/admin/reports/tabs/menu-report-tab";
import { ExpensesReportTab } from "@/components/admin/reports/tabs/expenses-report-tab";
import { InventoryReportTab } from "@/components/admin/reports/tabs/inventory-report-tab";
import { PayrollReportTab } from "@/components/admin/reports/tabs/payroll-report-tab";
import { ProfitLossReportTab } from "@/components/admin/reports/tabs/profit-loss-report-tab";

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
  { id: "profit-loss", label: "Profit & Loss", icon: Scale },
];
const trendValueLabels: Partial<Record<ReportTab, string>> = {
  sales: "Revenue",
  expenses: "Expenses",
  "profit-loss": "Revenue",
};
const empty: ReportData = {
  tab: "sales",
  range: { start: "", end: "" },
  kpis: [],
  trend: [],
  breakdown: [],
  inventoryMovements: [],
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
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(filters);
  const [data, setData] = useState<ReportData>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryMovementsPage, setInventoryMovementsPage] = useState(1);
  const inventoryMovementPageSize = 15;
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
  const updateDraft = (key: keyof ReportFilters, value: string) =>
    setDraftFilters((current) => ({ ...current, [key]: value }));
  const clearCustomFilter = () => {
    const defaultFilters: ReportFilters = {
      period: "THIS_MONTH",
      paymentMethod: "ALL",
      orderStatus: "ALL",
      expenseType: "ALL",
      movementType: "ALL",
    };
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  };
  const applyCustomFilter = () => {
    if (
      draftFilters.period === "CUSTOM" &&
      draftFilters.startDate &&
      draftFilters.endDate
    ) {
      setFilters(draftFilters);
    }
  };
  const canApplyCustomFilter = Boolean(
    draftFilters.startDate && draftFilters.endDate,
  );
  const inventoryMovements = data.inventoryMovements ?? [];
  const inventoryMovementTotalPages = Math.max(
    1,
    Math.ceil(inventoryMovements.length / inventoryMovementPageSize),
  );
  const inventoryMovementPage = Math.min(
    inventoryMovementsPage,
    inventoryMovementTotalPages,
  );
  const inventoryMovementRows = inventoryMovements.slice(
    (inventoryMovementPage - 1) * inventoryMovementPageSize,
    inventoryMovementPage * inventoryMovementPageSize,
  );
  const activeTabLabel = tabs.find((item) => item.id === tab)?.label ?? tab;

  const renderTabContent = () => {
    switch (tab) {
      case "sales":
        return (
          <SalesReportTab
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            isLoading={isLoading}
          />
        );
      case "menu":
        return (
          <MenuReportTab
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            isLoading={isLoading}
          />
        );
      case "expenses":
        return (
          <ExpensesReportTab
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            isLoading={isLoading}
          />
        );
      case "inventory":
        return (
          <InventoryReportTab
            movements={inventoryMovementRows}
            allMovements={inventoryMovements}
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            movementTypeFilter={filters.movementType ?? "ALL"}
            onMovementTypeFilterChange={(type) => {
              update("movementType", type);
              setInventoryMovementsPage(1);
            }}
            currentPage={inventoryMovementPage}
            totalPages={inventoryMovementTotalPages}
            totalEntries={inventoryMovements.length}
            isLoading={isLoading}
            onPageChange={setInventoryMovementsPage}
          />
        );
      case "payroll":
        return (
          <PayrollReportTab
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            isLoading={isLoading}
          />
        );
      case "profit-loss":
        return (
          <ProfitLossReportTab
            data={data}
            label={activeTabLabel}
            trendValueLabel={trendValueLabels[tab] ?? "Amount"}
            isLoading={isLoading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Reports & Analytics" />
      <main className="mt-4 flex flex-col gap-6">
        <div className="flex items-center justify-end ">
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 w-fit border border-slate-200 bg-white p-4 shadow-2xs">
            <Select
              label="Period"
              value={draftFilters.period}
              onChange={(event) => {
                if (event.target.value === "THIS_MONTH") {
                  clearCustomFilter();
                } else {
                  updateDraft("period", event.target.value);
                }
              }}
              options={[
                { value: "THIS_MONTH", label: "This Month" },
                { value: "CUSTOM", label: "Custom range" },
              ]}
            />
            {draftFilters.period === "CUSTOM" && (
              <>
                <Input
                  label="From"
                  type="date"
                  value={draftFilters.startDate ?? ""}
                  onChange={(event) =>
                    updateDraft("startDate", event.target.value)
                  }
                />
                <Input
                  label="To"
                  type="date"
                  value={draftFilters.endDate ?? ""}
                  onChange={(event) =>
                    updateDraft("endDate", event.target.value)
                  }
                />
              </>
            )}
            {filters.period === "CUSTOM" ? (
              <Button
                variant="outline"
                icon={<X size={16} />}
                onClick={clearCustomFilter}
                className="sm:h-13"
              >
                Clear
              </Button>
            ) : draftFilters.period === "CUSTOM" ? (
              <Button
                variant="primary"
                icon={<Filter size={16} />}
                onClick={applyCustomFilter}
                isLoading={isLoading}
                disabled={!canApplyCustomFilter}
                className="sm:h-13"
              >
                Apply
              </Button>
            ) : null}
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

        {/* Active tab UI */}
        {renderTabContent()}
      </main>
    </div>
  );
}
