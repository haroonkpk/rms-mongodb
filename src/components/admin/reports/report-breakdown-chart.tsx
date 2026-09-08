"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { BreakdownPoint } from "@/types/reports";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function ReportBreakdownChart({ data }: { data: BreakdownPoint[] }) {
  const breakdownData = data.slice(0, 8);
  const largest = breakdownData.reduce(
    (current, item) => (item.amount > current.amount ? item : current),
    breakdownData[0] ?? { label: "", amount: 0, count: 0 },
  );

  return (
    <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
      <h2 className="text-lg font-bold text-slate-900">Breakdown</h2>
      <p className="mb-4 text-xs text-slate-500">Largest contributors first</p>
      {breakdownData.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={breakdownData}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={76}
              label={({ name, percent: share }) =>
                `${name} ${Math.round((share ?? 0) * 100)}%`
              }
            >
              {breakdownData.map((item, index) => (
                <Cell
                  key={item.label}
                  fill={
                    item.label === largest.label
                      ? "var(--color-success-text)"
                      : index % 2
                        ? "#f59e0b"
                        : "var(--color-primary)"
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No breakdown data for this period.
        </div>
      )}
    </Card>
  );
}
