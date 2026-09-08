"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { BreakdownPoint } from "@/types/reports";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

// Qualitative palette first; golden-angle hues keep additional categories distinct.
const categoricalPalette = [
  "#2563EB",
  "#F59E0B",
  "#8B5CF6",
  "#D946EF",
  "#0891B2",
  "#EA580C",
  "#4F46E5",
  "#DB2777",
  "#65A30D",
  "#0F766E",
  "#9333EA",
  "#CA8A04",
];

function getSliceColor(index: number, isLargest: boolean) {
  if (isLargest) return "var(--color-success-text)";
  if (index < categoricalPalette.length) return categoricalPalette[index];

  const hue = (index * 137.508) % 360;
  return `hsl(${hue} 68% 45%)`;
}

export function ReportBreakdownChart({ data }: { data: BreakdownPoint[] }) {
  const breakdownData = data;
  const largest = breakdownData.reduce(
    (current, item) => (item.amount > current.amount ? item : current),
    breakdownData[0] ?? { label: "", amount: 0, count: 0 },
  );

  return (
    <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
      <h2 className="text-lg font-bold text-slate-900">Breakdown</h2>
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
                  fill={getSliceColor(
                    item.label === largest.label ? -1 : index,
                    item.label === largest.label,
                  )}
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
