"use client";

import React, { useState } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { PrintPdfButton } from "@/components/shared/print-pdf-button";
import { Eye } from "lucide-react";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function ReportDetailTable({
  heading,
  rows,
  isLoading,
  headerActions,
  onView,
}: {
  heading: string;
  rows: Array<Record<string, string | number>>;
  isLoading: boolean;
  headerActions?: React.ReactNode;
  onView?: (row: Record<string, string | number>) => void;
}) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hiddenKeys = new Set(["orderDetails"]);
  const headers: TableHeader[] = Object.keys(rows[0] ?? {})
    .filter((key) => !hiddenKeys.has(key))
    .map((key) => ({
      key,
      label: key.replaceAll("_", " "),
    }));
  const tableRows = pageRows.map((row, index) => ({
    id: `${heading}-${index}`,
    rawRow: row,
    ...Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => !hiddenKeys.has(key))
        .map(([key, value]) => {
          const formattedValue =
            typeof value === "number" &&
            [
              "amount",
              "sales",
              "revenue",
              "value",
              "net",
              "paid",
              "total",
              "due",
            ].some((part) => key.includes(part))
              ? money(value)
              : String(value);

          return [
            key,
            key === "paid" && formattedValue === "No" ? (
              <span className="inline-flex bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                No
              </span>
            ) : (
              formattedValue
            ),
          ];
        }),
    ),
  }));
  const pdfHeaders = headers.map((header) => ({
    key: header.key,
    label: header.label,
  }));
  const pdfRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => !hiddenKeys.has(key))
        .map(([key, value]) => [
          key,
          typeof value === "number" &&
          [
            "amount",
            "sales",
            "revenue",
            "value",
            "net",
            "paid",
            "total",
            "due",
          ].some((part) => key.includes(part))
            ? money(value)
            : String(value),
        ]),
    ),
  );

  return (
    <DataTable
      heading={heading}
      TableHeaders={headers}
      TableData={tableRows}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalEntries={rows.length}
      isLoading={isLoading}
      onPageChange={setPage}
      headerActions={
        <div className="flex items-center gap-2">
          {headerActions}
          <PrintPdfButton
            headers={pdfHeaders}
            data={pdfRows}
            title={heading}
            subtitle="Reports & Analytics"
            fileName={heading.replaceAll(" ", "_").toLowerCase()}
          />
        </div>
      }
      TableButtons={
        onView
          ? [
              {
                icon: <Eye size={15} />,
                text: "View details",
                className:
                  "bg-(--color-page-bg) text-(--color-primary) border border-(--color-secondary-bg)",
                onClick: (row) => onView(row.rawRow),
              },
            ]
          : undefined
      }
    />
  );
}
