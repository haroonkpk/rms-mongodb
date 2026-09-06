"use client";

import React from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Edit2, Trash2 } from "lucide-react";
import { InventoryCategoryData } from "@/actions/inventory";

interface InventoryCategoriesTableProps {
  categories: InventoryCategoryData[];
  isLoading: boolean;
  onEdit: (category: InventoryCategoryData) => void;
  onDelete: (id: string, name: string) => void;
}

export const InventoryCategoriesTable: React.FC<InventoryCategoriesTableProps> = ({
  categories,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const tableHeaders: TableHeader[] = [
    { key: "nameFormatted", label: "Category Name" },
    { key: "descriptionFormatted", label: "Description" },
    { key: "itemCountFormatted", label: "Linked Stock Items" },
  ];

  const formattedData = categories.map((cat) => ({
    id: cat.id,
    nameFormatted: (
      <span className="font-bold text-slate-900">{cat.name}</span>
    ),
    descriptionFormatted: (
      <span className="text-slate-600">{cat.description || "N/A"}</span>
    ),
    itemCountFormatted: (
      <span className="px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-800 text-xs">
        {cat.itemCount} Items
      </span>
    ),
    rawCategory: cat,
  }));

  const tableButtons = [
    {
      icon: <Edit2 size={15} />,
      text: "Edit Category",
      className: "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200",
      onClick: (row: (typeof formattedData)[0]) => onEdit(row.rawCategory),
    },
    {
      icon: <Trash2 size={15} />,
      text: "Delete Category",
      className: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
      onClick: (row: (typeof formattedData)[0]) =>
        onDelete(row.id, row.rawCategory.name),
    },
  ];

  return (
    <DataTable
      heading="Raw Material Categories"
      TableHeaders={tableHeaders}
      TableData={formattedData}
      TableButtons={tableButtons}
      currentPage={1}
      totalPages={1}
      isLoading={isLoading}
      onPageChange={() => {}}
    />
  );
};
