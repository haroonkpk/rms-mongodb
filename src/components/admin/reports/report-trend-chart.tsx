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
import { TrendPoint } from "@/types/reports";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function ReportTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="border border-slate-200 bg-white p-5 shadow-2xs">
      <h2 className="text-lg font-bold text-slate-900">Trend</h2>
    
      {data.length ? (
        <div className="mt-4 h-64 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
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
                tickFormatter={(value) => `Rs ${value}`}
                width={85}
              />
              <Tooltip
                formatter={(value) => [money(Number(value)), "Revenue"]}
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
              <Area
                type="monotone"
                dataKey="amount"
                name="Revenue"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#reportTrendFill)"
              />
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
