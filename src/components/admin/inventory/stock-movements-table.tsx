"use client";

import React from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { StockMovementData } from "@/actions/inventory";

interface StockMovementsTableProps {
  movements: StockMovementData[];
  movementTypeFilter: string;
  onMovementTypeFilterChange: (type: string) => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
  movements,
  movementTypeFilter,
  onMovementTypeFilterChange,
  currentPage,
  totalPages,
  totalEntries,
  isLoading,
  onPageChange,
}) => {
  const tableHeaders: TableHeader[] = [
    { key: "createdAtFormatted", label: "Date & Time" },
    { key: "inventoryItemName", label: "Raw Item" },
    { key: "typeBadge", label: "Movement Type" },
    { key: "quantityChangeFormatted", label: "Qty Change" },
    { key: "stockAuditFormatted", label: "Before → After" },
    { key: "reasonFormatted", label: "Notes / Reason" },
  ];

  const formattedData = movements.map((m) => {
    let typeBadgeColor = "bg-blue-100 text-blue-800 border-blue-200";
    let typeLabel = "Stock Intake";

    if (m.type === "PURCHASE_IN") {
      typeBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
      typeLabel = "Purchase IN";
    } else if (m.type === "WASTAGE_OUT") {
      typeBadgeColor = "bg-rose-100 text-rose-800 border-rose-200";
      typeLabel = "Wastage OUT";
    } else if (m.type === "SPOILAGE_OUT") {
      typeBadgeColor = "bg-purple-100 text-purple-800 border-purple-200";
      typeLabel = "Spoilage / Expired";
    } else if (m.type === "MANUAL_ADJUSTMENT") {
      typeBadgeColor = "bg-amber-100 text-amber-800 border-amber-200";
      typeLabel = "Audit Correction";
    } else if (m.type === "SALE_DEDUCTION") {
      typeBadgeColor = "bg-slate-100 text-slate-800 border-slate-200";
      typeLabel = "Order Sale";
    }

    const isPositive = m.quantityChange > 0;

    return {
      id: m.id,
      createdAtFormatted: (
        <span className="text-slate-600 font-mono text-xs">
          {new Date(m.createdAt).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
      inventoryItemName: (
        <span className="font-semibold text-slate-900">{m.inventoryItemName}</span>
      ),
      typeBadge: (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${typeBadgeColor}`}
        >
          {typeLabel}
        </span>
      ),
      quantityChangeFormatted: (
        <span
          className={`font-bold ${
            isPositive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isPositive ? `+${m.quantityChange}` : m.quantityChange} {m.unit}
        </span>
      ),
      stockAuditFormatted: (
        <span className="text-xs text-slate-500 font-mono">
          {m.previousQuantity} {m.unit} →{" "}
          <strong className="text-slate-900">{m.newQuantity} {m.unit}</strong>
        </span>
      ),
      reasonFormatted: (
        <span className="text-xs text-slate-600 italic">
          {m.reason || "No notes"}
        </span>
      ),
    };
  });

  const headerActions = (
    <div className="w-48">
      <Select
        value={movementTypeFilter}
        onChange={(e) => onMovementTypeFilterChange(e.target.value)}
        options={[
          { label: "All Movement Types", value: "ALL" },
          { label: "Purchase IN", value: "PURCHASE_IN" },
          { label: "Wastage OUT", value: "WASTAGE_OUT" },
          { label: "Spoilage / Expired", value: "SPOILAGE_OUT" },
          { label: "Audit Correction", value: "MANUAL_ADJUSTMENT" },
          { label: "Sale Deduction", value: "SALE_DEDUCTION" },
        ]}
      />
    </div>
  );

  return (
    <DataTable
      heading="Stock Audit & Movements History"
      TableHeaders={tableHeaders}
      TableData={formattedData}
      currentPage={currentPage}
      totalPages={totalPages}
      totalEntries={totalEntries}
      isLoading={isLoading}
      onPageChange={onPageChange}
      headerActions={headerActions}
    />
  );
};
