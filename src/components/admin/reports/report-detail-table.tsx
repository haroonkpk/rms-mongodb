"use client";

import React from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function ReportDetailTable({
  heading,
  rows,
  isLoading,
}: {
  heading: string;
  rows: Array<Record<string, string | number>>;
  isLoading: boolean;
}) {
  const headers: TableHeader[] = Object.keys(rows[0] ?? {}).map((key) => ({
    key,
    label: key.replaceAll("_", " "),
  }));
  const tableRows = rows.map((row, index) => ({
    id: `${heading}-${index}`,
    ...Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "number" &&
        ["amount", "sales", "revenue", "value", "net", "paid"].some((part) =>
          key.includes(part),
        )
          ? money(value)
          : String(value),
      ]),
    ),
  }));

  return (
    <DataTable
      heading={heading}
      TableHeaders={headers}
      TableData={tableRows}
      currentPage={1}
      totalPages={1}
      totalEntries={rows.length}
      isLoading={isLoading}
      onPageChange={() => {}}
    />
  );
}
