"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { ExpenseTypeData } from "@/actions/expenses";

export function ExpenseTypesTable({
  expenseTypes,
  isLoading,
  onEdit,
  onDelete,
}: {
  expenseTypes: ExpenseTypeData[];
  isLoading: boolean;
  onEdit: (expenseType: ExpenseTypeData) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const headers: TableHeader[] = [
    { key: "name", label: "Expense Type" },
    { key: "expenseCount", label: "Linked Expenses" },
  ];
  const rows = expenseTypes.map((expenseType) => ({
    ...expenseType,
    expenseCount: (
      <span className="border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        {expenseType.expenseCount} Expenses
      </span>
    ),
  }));

  return (
    <DataTable
      heading="Expense Types"
      TableHeaders={headers}
      TableData={rows}
      isLoading={isLoading}
      currentPage={1}
      totalPages={1}
      onPageChange={() => {}}
      TableButtons={[
        {
          icon: <Edit2 size={15} />,
          text: "Edit Expense Type",
          className:
            "bg-(--color-page-bg) text-(--color-primary) border border-(--color-secondary-bg)",
          onClick: (row) =>
            onEdit(expenseTypes.find((item) => item.id === row.id)!),
        },
        {
          icon: <Trash2 size={15} />,
          text: "Delete Expense Type",
          className: "bg-rose-50 text-rose-600 border border-rose-200",
          onClick: (row) =>
            onDelete(
              row.id,
              expenseTypes.find((item) => item.id === row.id)!.name,
            ),
        },
      ]}
    />
  );
}
