"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CircleDollarSign,
  ClipboardList,
  CookingPot,
  PackageX,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/layouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { getDashboardData } from "@/actions/dashboard";
import { DashboardData } from "@/types/reports";

const emptyData: DashboardData = {
  range: { start: "", end: "" },
  kpis: {
    sales: 0,
    orders: 0,
    averageOrder: 0,
    outstanding: 0,
    expenses: 0,
    operatingResult: 0,
  },
  salesTrend: [],
  paymentMix: [],
  orderStatus: [],
  topItems: [],
  alerts: [],
  stock: { low: [], out: [] },
  latestCompletedOrders: [],
  workforce: { present: 0, absent: 0, payrollOutstanding: 0 },
  recentExpenses: [],
};
const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

type CompletedOrderRow = {
  id: string;
  order: React.ReactNode;
  date: React.ReactNode;
  value: React.ReactNode;
};

function Kpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number }>;
  tone?: "default" | "good" | "warning";
}) {
  return (
    <Card className="flex items-start justify-between border border-slate-200 bg-white p-5 shadow-2xs">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        <p
          className={`mt-1 text-xs ${tone === "good" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-slate-500"}`}
        >
          {detail}
        </p>
      </div>
      <span
        className={`p-3 ${tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-(--color-primary)"}`}
      >
        <Icon size={21} />
      </span>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const load = async () => {
    setIsLoading(true);
    try {
      setData(await getDashboardData());
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);
  const statusTotal = data.orderStatus.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const activeKitchenOrders =
    data.alerts.find((alert) => alert.label === "Active kitchen orders")
      ?.value ?? 0;
  const completedOrderRows: CompletedOrderRow[] =
    data.latestCompletedOrders.map((order) => ({
      id: order.id,
      order: (
        <span className="font-semibold text-slate-800">
          {order.orderNumber}
        </span>
      ),
      date: (
        <span className="text-slate-600">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      ),
      value: (
        <span className="font-bold text-slate-900">{money(order.amount)}</span>
      ),
    }));

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Admin Overview Dashboard" />
      <main className="mt-4 flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-3 border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Today
            </p>
            <h1 className="text-xl font-black text-slate-900">
              Restaurant at a glance
            </h1>
          </div>
          <Button
            variant="outline"
            icon={<RefreshCw size={16} />}
            onClick={() => void load()}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi
            label="Sales"
            value={money(data.kpis.sales)}
            detail={`${data.kpis.orders} completed orders`}
            icon={CircleDollarSign}
            tone="good"
          />
          <Kpi
            label="Orders"
            value={String(data.kpis.orders)}
            detail={`Avg ${money(data.kpis.averageOrder)}`}
            icon={ClipboardList}
          />
          <Kpi
            label="Kitchen orders"
            value={String(activeKitchenOrders)}
            detail="Pending, preparing or ready"
            icon={CookingPot}
            tone={activeKitchenOrders ? "warning" : "good"}
          />
          <Kpi
            label="Outstanding"
            value={money(data.kpis.outstanding)}
            detail="Unpaid ledger balance"
            icon={ClipboardList}
            tone="warning"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-lg font-bold text-slate-900">
              Operational alerts
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.label}
                  className="flex items-center justify-between border-b border-slate-100 pb-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={16}
                      className={
                        alert.tone === "danger"
                          ? "text-rose-600"
                          : alert.tone === "warning"
                            ? "text-amber-600"
                            : "text-sky-600"
                      }
                    />
                    <span className="text-sm text-slate-700">
                      {alert.label}
                    </span>
                  </div>
                  <strong className="text-slate-900">
                    {alert.label.includes("payroll")
                      ? money(alert.value)
                      : alert.value}
                  </strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-lg font-bold text-slate-900">
              Workforce today
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Present</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">
                  {data.workforce.present}
                </p>
              </div>
              <div className="bg-rose-50 p-4">
                <p className="text-xs text-rose-700">Absent</p>
                <p className="mt-1 text-2xl font-black text-rose-900">
                  {data.workforce.absent}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Orders tracked</span>
              <span className="font-bold text-slate-900">{statusTotal}</span>
            </div>
            {data.orderStatus.slice(0, 4).map((item) => (
              <div
                key={item.label}
                className="mt-2 flex justify-between text-xs text-slate-600"
              >
                <span>{item.label}</span>
                <span>{item.count}</span>
              </div>
            ))}
          </Card>
        </div>
        <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Stock details
              </h2>
              <p className="text-xs text-slate-500">
                Items that need attention right now
              </p>
            </div>
            <PackageX size={20} className="text-(--color-primary)" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-rose-700">Out of stock</h3>
              <div className="mt-2 flex flex-col gap-2">
                {data.stock.out.length ? (
                  data.stock.out.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b border-slate-100 pb-2 text-sm"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-rose-700">0 {item.unit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No items out of stock.
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-700">Low stock</h3>
              <div className="mt-2 flex flex-col gap-2">
                {data.stock.low.length ? (
                  data.stock.low.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b border-slate-100 pb-2 text-sm"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="text-amber-700">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No low stock items.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
        <DataTable
          heading="Latest completed orders"
          TableHeaders={[
            { key: "order", label: "Order" },
            { key: "date", label: "Date" },
            { key: "value", label: "Value" },
          ]}
          TableData={completedOrderRows}
          currentPage={1}
          totalPages={1}
          onPageChange={() => undefined}
          totalEntries={completedOrderRows.length}
        />
      </main>
    </div>
  );
}
