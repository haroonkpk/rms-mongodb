"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendChartPoint, TrendPoint, TrendSeries } from "@/types/reports";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function ReportTrendChart({
  data,
  title,
  valueLabel,
  valueFormat = "money",
  seriesData,
  series,
  isLoading = false,
}: {
  data: TrendPoint[];
  title: string;
  valueLabel: string;
  valueFormat?: "money" | "quantity";
  seriesData?: TrendChartPoint[];
  series?: TrendSeries[];
  isLoading?: boolean;
}) {
  const chartData: TrendPoint[] = seriesData?.length
    ? seriesData.map((point) => ({
        ...point,
        amount: Number(point.amount ?? 0),
        count: Number(point.count ?? 0),
      }))
    : data;
  return (
    <Card className="w-full min-w-4xl border border-slate-200 bg-white p-5 shadow-2xs">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>

      {isLoading ? (
        <div className="mt-4 h-64 w-full animate-pulse rounded-sm bg-slate-100 sm:h-72" />
      ) : chartData.length ? (
        <div className="mt-4 h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="reportTrendFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={15}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickFormatter={(value) =>
                  valueFormat === "quantity" ? value : `Rs ${value}`
                }
                width={85}
              />
              <Tooltip
                formatter={(value, name) => [
                  valueFormat === "quantity"
                    ? `${Number(value).toLocaleString()} items`
                    : money(Number(value)),
                  series?.length ? String(name ?? valueLabel) : valueLabel,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{
                  fontWeight: "bold",
                  color: "#0A2540",
                  marginBottom: "4px",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px",
                  color: "#64748B",
                }}
                iconType="circle"
              />
              {series?.length ? (
                series.map((item) => (
                  <Area
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={item.label}
                    stroke={item.color}
                    strokeWidth={2}
                    fill={item.color}
                    fillOpacity={0.12}
                    connectNulls
                  />
                ))
              ) : (
                <Area
                  type="monotone"
                  dataKey="amount"
                  name={valueLabel}
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#reportTrendFill)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No trend data for this period.
        </div>
      )}
    </Card>
  );
}
