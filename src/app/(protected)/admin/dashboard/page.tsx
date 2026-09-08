"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import { Header } from "@/components/layouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/actions/dashboard";
import { DashboardData } from "@/types/reports";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  workforce: { present: 0, absent: 0, payrollOutstanding: 0 },
  recentExpenses: [],
};
const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
            label="Outstanding"
            value={money(data.kpis.outstanding)}
            detail="Unpaid ledger balance"
            icon={ArrowDownRight}
            tone="warning"
          />
          <Kpi
            label="Expenses"
            value={money(data.kpis.expenses)}
            detail="Recorded today"
            icon={ArrowUpRight}
          />
          <Kpi
            label="Operating result"
            value={money(data.kpis.operatingResult)}
            detail="Sales minus expenses"
            icon={BarChart3}
            tone={data.kpis.operatingResult >= 0 ? "good" : "warning"}
          />
          <Kpi
            label="Payroll due"
            value={money(data.workforce.payrollOutstanding)}
            detail="Draft payroll records"
            icon={Users}
            tone="warning"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sales trend
                </h2>
                <p className="text-xs text-slate-500">
                  Completed sales by hour
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                {money(data.kpis.sales)} today
              </span>
            </div>
            {data.salesTrend.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `Rs ${value}`}
                  />
                  <Tooltip formatter={(value) => money(Number(value))} />
                  <Bar
                    dataKey="amount"
                    fill="var(--color-primary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                No completed sales today.
              </div>
            )}
          </Card>
          <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-lg font-bold text-slate-900">Payment mix</h2>
            <p className="mb-3 text-xs text-slate-500">
              Completed order value by method
            </p>
            {data.paymentMix.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.paymentMix}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent: share }) =>
                      `${name} ${Math.round((share ?? 0) * 100)}%`
                    }
                  >
                    {data.paymentMix.map((item, index) => (
                      <Cell
                        key={item.label}
                        fill={index % 2 ? "#f59e0b" : "var(--color-primary)"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500">
                No payment data yet.
              </div>
            )}
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <h2 className="text-lg font-bold text-slate-900">Top menu items</h2>
            <div className="mt-4 flex flex-col gap-3">
              {data.topItems.length ? (
                data.topItems.slice(0, 5).map((item, index) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-slate-100 pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center bg-rose-50 text-xs font-black text-(--color-primary)">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {money(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No menu sales today.</p>
              )}
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
          <div className="mb-4 flex items-center gap-2">
            <PackageCheck size={19} className="text-(--color-primary)" />
            <h2 className="text-lg font-bold text-slate-900">
              Recent expenses
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      {expense.title}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{expense.type}</td>
                    <td className="px-3 py-3 text-slate-600">{expense.date}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">
                      {money(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
