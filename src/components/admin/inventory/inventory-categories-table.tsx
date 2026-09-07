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

export const InventoryCategoriesTable: React.FC<
  InventoryCategoriesTableProps
> = ({ categories, isLoading, onEdit, onDelete }) => {
  const tableHeaders: TableHeader[] = [
    { key: "nameFormatted", label: "Category Name" },
    { key: "itemCountFormatted", label: "Linked Stock Items" },
  ];

  const formattedData = categories.map((cat) => ({
    id: cat.id,
    nameFormatted: cat.name,
    itemCountFormatted: (
      <span className="px-2.5 py-1 roundedtext-xs font-semibold border  bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
        {cat.itemCount} Items
      </span>
    ),
    rawCategory: cat,
  }));

  const tableButtons = [
    {
      icon: <Edit2 size={15} />,
      text: "Edit Category",
      className:
        "bg-(--color-page-bg) text-(--color-primary) border border-(--color-secondary-bg) ",
      onClick: (row: (typeof formattedData)[0]) => onEdit(row.rawCategory),
    },
    {
      icon: <Trash2 size={15} />,
      text: "Delete Category",
      className:
        "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
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
