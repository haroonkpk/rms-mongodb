"use client";

import React from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { PrintPdfButton } from "@/components/shared/print-pdf-button";
import { StockMovementData } from "@/actions/inventory";

interface StockMovementsTableProps {
  movements: StockMovementData[];
  pdfMovements?: StockMovementData[];
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
  pdfMovements = movements,
  movementTypeFilter,
  onMovementTypeFilterChange,
  currentPage,
  totalPages,
  totalEntries,
  isLoading,
  onPageChange,
}) => {
  const movementLabel = (type: StockMovementData["type"]) => {
    if (type === "PURCHASE_IN") return "Purchase IN";
    if (type === "WASTAGE_OUT") return "Wastage OUT";
    if (type === "SPOILAGE_OUT") return "Expired";
    if (type === "MANUAL_ADJUSTMENT") return "Audit Correction";
    if (type === "SALE_DEDUCTION") return "Order Sale";
    return "Stock Intake";
  };

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
    const typeLabel = movementLabel(m.type);

    if (m.type === "PURCHASE_IN") {
      typeBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    } else if (m.type === "WASTAGE_OUT") {
      typeBadgeColor = "bg-rose-100 text-rose-800 border-rose-200";
    } else if (m.type === "SPOILAGE_OUT") {
      typeBadgeColor = "bg-purple-100 text-purple-800 border-purple-200";
    } else if (m.type === "MANUAL_ADJUSTMENT") {
      typeBadgeColor = "bg-amber-100 text-amber-800 border-amber-200";
    } else if (m.type === "SALE_DEDUCTION") {
      typeBadgeColor = "bg-slate-100 text-slate-800 border-slate-200";
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
        <span className="font-semibold text-slate-900">
          {m.inventoryItemName}
        </span>
      ),
      typeBadge: (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border ${typeBadgeColor}`}
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
          {isPositive
            ? `+${m.quantityChange.toFixed(2)}`
            : m.quantityChange.toFixed(2)}{" "}
          {m.unit}
        </span>
      ),
      stockAuditFormatted: (
        <span className="text-xs text-slate-500 font-mono">
          {m.previousQuantity.toFixed(2)} {m.unit} →{" "}
          <strong className="text-slate-900">
            {m.newQuantity.toFixed(2)} {m.unit}
          </strong>
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
    <div className="flex items-center gap-2">
      <div className="w-48">
        <Select
          value={movementTypeFilter}
          onChange={(e) => onMovementTypeFilterChange(e.target.value)}
          options={[
            { label: "All Movement Types", value: "ALL" },
            { label: "Purchase IN", value: "PURCHASE_IN" },
            { label: "Wastage OUT", value: "WASTAGE_OUT" },
            { label: "Expired", value: "SPOILAGE_OUT" },
            { label: "Audit Correction", value: "MANUAL_ADJUSTMENT" },
            { label: "Sale Deduction", value: "SALE_DEDUCTION" },
          ]}
        />
      </div>
      <PrintPdfButton
        headers={[
          { key: "date", label: "Date & Time" },
          { key: "item", label: "Raw Item" },
          { key: "movement", label: "Movement Type" },
          { key: "quantity", label: "Qty Change" },
          { key: "audit", label: "Before -> After" },
          { key: "reason", label: "Notes / Reason" },
        ]}
        data={pdfMovements.map((movement) => ({
          date: new Date(movement.createdAt).toLocaleString("en-GB"),
          item: movement.inventoryItemName,
          movement: movementLabel(movement.type),
          quantity: `${movement.quantityChange > 0 ? "+" : ""}${movement.quantityChange.toFixed(2)} ${movement.unit}`,
          audit: `${movement.previousQuantity.toFixed(2)} ${movement.unit} -> ${movement.newQuantity.toFixed(2)} ${movement.unit}`,
          reason: movement.reason || "No notes",
        }))}
        title="Stock Audit & Movements History"
        subtitle="Inventory Reports"
        fileName="stock_audit_movements_history"
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
