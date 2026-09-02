"use client";

import React, { useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Edit, Trash2 } from "lucide-react";
import { CategoryData } from "@/actions/menu";

const categoryTableHeaders: TableHeader[] = [
  { key: "name", label: "Category Name" },
  { key: "itemCountBadge", label: "Total Items" },
];

interface CategoriesTableProps {
  categories: CategoryData[];
  onEdit: (cat: CategoryData) => void;
  onDelete: (id: string, name: string) => void;
  isLoading?: boolean;
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  isLoading = false,
}: CategoriesTableProps) {
  const formattedCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      itemCountBadge: (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
          {cat.itemCount} Items
        </span>
      ),
    }));
  }, [categories]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        heading="Menu Categories"
        TableHeaders={categoryTableHeaders}
        TableData={formattedCategories}
        currentPage={1}
        totalPages={1}
        totalEntries={categories.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-slate-700" />,
            text: "Edit Category",
            className: "bg-slate-100 hover:bg-slate-200",
            onClick: (row) => onEdit(row as unknown as CategoryData),
          },
          {
            icon: <Trash2 size={16} className="text-rose-600" />,
            text: "Delete Category",
            className: "bg-rose-50 hover:bg-rose-100",
            onClick: (row) =>
              onDelete(
                (row as unknown as CategoryData).id,
                (row as unknown as CategoryData).name
              ),
          },
        ]}
      />
    </div>
  );
}
