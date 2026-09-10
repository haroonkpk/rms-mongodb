"use client";

import React, { useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";
import { AddOnData } from "@/actions/menu";

const addOnTableHeaders: TableHeader[] = [
  { key: "name", label: "Add-On / Modifier Name" },
  { key: "formattedPrice", label: "Extra Price" },
  { key: "availabilityToggle", label: "Availability Status" },
];

interface AddOnsTableProps {
  addOns: AddOnData[];
  onEdit: (addon: AddOnData) => void;
  onDelete: (id: string, name: string) => void;
  isLoading?: boolean;
}

export function AddOnsTable({
  addOns,
  onEdit,
  onDelete,
  isLoading = false,
}: AddOnsTableProps) {
  const formattedAddOns = useMemo(() => {
    return addOns.map((addon) => ({
      ...addon,
      formattedPrice: (
        <span className="font-bold text-slate-900 text-sm">
          + Rs {addon.price.toLocaleString()}
        </span>
      ),
      availabilityToggle: (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border border-slate-200 ${
            addon.isAvailable
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {addon.isAvailable ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Available</span>
            </>
          ) : (
            <>
              <XCircle size={14} className="text-amber-600" />
              <span>Disabled</span>
            </>
          )}
        </span>
      ),
    }));
  }, [addOns]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        heading="Add-Ons & Extra Modifiers "
        TableHeaders={addOnTableHeaders}
        TableData={formattedAddOns}
        currentPage={1}
        totalPages={1}
        totalEntries={addOns.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-slate-700" />,
            text: "Edit Modifier",
            className: "bg-slate-100 hover:bg-slate-200",
            onClick: (row) => onEdit(row as unknown as AddOnData),
          },
          {
            icon: <Trash2 size={16} className="text-rose-600" />,
            text: "Delete Modifier",
            className: "bg-rose-50 hover:bg-rose-100",
            onClick: (row) =>
              onDelete(
                (row as unknown as AddOnData).id,
                (row as unknown as AddOnData).name
              ),
          },
        ]}
      />
    </div>
  );
}
