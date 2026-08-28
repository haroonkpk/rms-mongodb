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
  onToggleAvailability: (id: string, currentStatus: boolean) => void;
}

export function AddOnsTable({
  addOns,
  onEdit,
  onDelete,
  onToggleAvailability,
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
        <button
          type="button"
          onClick={() => onToggleAvailability(addon.id, addon.isAvailable)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            addon.isAvailable
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
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
        </button>
      ),
    }));
  }, [addOns, onToggleAvailability]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        heading="Add-Ons & Extra Modifiers (e.g. Cheese, Sauces, Extra Patty)"
        TableHeaders={addOnTableHeaders}
        TableData={formattedAddOns}
        currentPage={1}
        totalPages={1}
        totalEntries={addOns.length}
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
