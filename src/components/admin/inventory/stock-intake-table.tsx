"use client";

import React, { useState } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { StockIntakeBatchData } from "@/actions/inventory";
import { StockIntakeDetailsModal } from "@/components/admin/inventory/stock-intake-details-modal";
import { Eye } from "lucide-react";

interface StockIntakeTableProps {
  batches: StockIntakeBatchData[];
  isLoading: boolean;
}

export const StockIntakeTable: React.FC<StockIntakeTableProps> = ({
  batches,
  isLoading,
}) => {
  const [selectedBatch, setSelectedBatch] =
    useState<StockIntakeBatchData | null>(null);

  const tableHeaders: TableHeader[] = [
    { key: "Date", label: "Date" },
    { key: "countFormatted", label: "Items Count" },
    { key: "totalFormatted", label: "Total Cost (PKR)" },
    { key: "notesFormatted", label: "Notes" },
  ];

  const formattedData = batches.map((batch) => ({
    id: batch.id,
    Date: (
      <div className="flex items-center gap-2">
        {new Date(batch.createdAt).toLocaleString("en-GB")}
      </div>
    ),
    totalFormatted: (
      <span className="font-black text-slate-900 text-xs">
        PKR {batch.totalAmount.toLocaleString()}
      </span>
    ),
    countFormatted: (
      <span className="px-2 py-0.5 text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200 ">
        {batch.items.length} raw material{batch.items.length === 1 ? "" : "s"}
      </span>
    ),
    notesFormatted: (
      <span className="text-xs text-slate-600 truncate max-w-50 block">
        {batch.notes || "—"}
      </span>
    ),
    rawBatch: batch,
  }));

  const tableButtons = [
    {
      icon: <Eye size={15} />,
      text: "View Details",
      className:
        "bg-(--color-page-bg) hover:bg-(--color-secondary-bg) border border-(--color-secondary-bg) text-(--color-primary)",
      onClick: (row: (typeof formattedData)[0]) =>
        setSelectedBatch(row.rawBatch),
    },
  ];

  return (
    <>
      <DataTable
        heading="Stock Intake Batches History"
        TableHeaders={tableHeaders}
        TableData={formattedData}
        TableButtons={tableButtons}
        isLoading={isLoading}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />

      <StockIntakeDetailsModal
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
      />
    </>
  );
};
