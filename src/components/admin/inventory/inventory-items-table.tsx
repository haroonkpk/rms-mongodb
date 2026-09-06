"use client";

import React from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Edit2, Trash2, SlidersHorizontal } from "lucide-react";
import { InventoryItemData, InventoryCategoryData } from "@/actions/inventory";

interface InventoryItemsTableProps {
  items: InventoryItemData[];
  categories: InventoryCategoryData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  stockStatusFilter: "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK";
  onStockStatusFilterChange: (
    status: "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK",
  ) => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onEdit: (item: InventoryItemData) => void;
  onDelete: (id: string, name: string) => void;
  onAdjustStock: (item: InventoryItemData) => void;
}

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({
  items,
  categories,
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  stockStatusFilter,
  onStockStatusFilterChange,
  currentPage,
  totalPages,
  totalEntries,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onAdjustStock,
}) => {
  const tableHeaders: TableHeader[] = [
    { key: "nameFormatted", label: "Item Name" },
    { key: "categoryName", label: "Category" },
    { key: "quantityFormatted", label: "Current Stock" },
    { key: "minStockLevelFormatted", label: "Min Reorder Level" },
    { key: "unitCostFormatted", label: "Unit Cost" },
    { key: "totalValueFormatted", label: "Total Value" },
    { key: "statusBadge", label: "Stock Status" },
  ];

  const formattedData = items.map((item) => {
    let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    let statusText = "In Stock";

    if (item.stockStatus === "OUT_OF_STOCK") {
      badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
      statusText = "Out of Stock";
    } else if (item.stockStatus === "LOW_STOCK") {
      badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
      statusText = "Low Stock";
    }

    return {
      id: item.id,
      nameFormatted: (
        <span className="font-semibold text-slate-900">{item.name}</span>
      ),
      categoryName: item.categoryName,
      quantityFormatted: (
        <span className="font-bold text-slate-900">
          {item.quantity.toLocaleString()}{" "}
          <span className="text-xs font-normal text-slate-500">
            {item.unit}
          </span>
        </span>
      ),
      minStockLevelFormatted: (
        <span className="text-slate-600">
          {item.minStockLevel} {item.unit}
        </span>
      ),
      unitCostFormatted: (
        <span className="font-medium text-slate-700">
          PKR {item.unitCost.toLocaleString()}
        </span>
      ),
      totalValueFormatted: (
        <span className="font-bold text-slate-900">
          PKR {item.totalValue.toLocaleString()}
        </span>
      ),
      statusBadge: (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
        >
          {statusText}
        </span>
      ),
      rawItem: item,
    };
  });

  const tableButtons = [
    {
      icon: <SlidersHorizontal size={15} />,
      text: "Quick Adjust Stock",
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300",
      onClick: (row: (typeof formattedData)[0]) => onAdjustStock(row.rawItem),
    },
    {
      icon: <Edit2 size={15} />,
      text: "Edit Item",
      className:
        "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200",
      onClick: (row: (typeof formattedData)[0]) => onEdit(row.rawItem),
    },
    {
      icon: <Trash2 size={15} />,
      text: "Delete Item",
      className:
        "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
      onClick: (row: (typeof formattedData)[0]) =>
        onDelete(row.id, row.rawItem.name),
    },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Search Input */}
      <div className="w-full sm:w-48">
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Category Select Filter */}
      <div className="w-full sm:w-44">
        <Select
          value={selectedCategoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          options={[
            { label: "All Categories", value: "ALL" },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
      </div>

      {/* Stock Status Select Filter */}
      <div className="w-full sm:w-40">
        <Select
          value={stockStatusFilter}
          onChange={(e) =>
            onStockStatusFilterChange(
              e.target.value as "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK",
            )
          }
          options={[
            { label: "All Stock Levels", value: "ALL" },
            { label: "In Stock", value: "GOOD" },
            { label: "Low Stock Alert", value: "LOW_STOCK" },
            { label: "Out of Stock", value: "OUT_OF_STOCK" },
          ]}
        />
      </div>
    </div>
  );

  return (
    <DataTable
      heading="Raw Material Inventory"
      TableHeaders={tableHeaders}
      TableData={formattedData}
      TableButtons={tableButtons}
      currentPage={currentPage}
      totalPages={totalPages}
      totalEntries={totalEntries}
      isLoading={isLoading}
      onPageChange={onPageChange}
      headerActions={headerActions}
    />
  );
};
