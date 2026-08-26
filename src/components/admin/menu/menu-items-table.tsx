"use client";

import React, { useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Utensils, CheckCircle2, XCircle, Edit, Trash2 } from "lucide-react";
import { MenuItemData, CategoryData } from "@/actions/menu";

const itemTableHeaders: TableHeader[] = [
  { key: "imageDisplay", label: "Image" },
  { key: "nameDisplay", label: "Item Name & Details" },
  { key: "categoryBadge", label: "Category" },
  { key: "formattedPrice", label: "Base Price" },
  { key: "stockToggle", label: "POS Stock Status" },
];

interface MenuItemsTableProps {
  items: MenuItemData[];
  categories: CategoryData[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  stockStatusFilter: "ALL" | "AVAILABLE" | "OUT_OF_STOCK";
  onStockStatusFilterChange: (status: "ALL" | "AVAILABLE" | "OUT_OF_STOCK") => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  onEdit: (item: MenuItemData) => void;
  onDelete: (id: string, name: string) => void;
  onToggleAvailability: (id: string, currentStatus: boolean) => void;
}

export function MenuItemsTable({
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
  onPageChange,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemsTableProps) {
  const categoryFilterOptions: SelectOption[] = useMemo(() => {
    const opts = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
    return [{ value: "ALL", label: "All Categories" }, ...opts];
  }, [categories]);

  const formattedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      imageDisplay: (
        <div className="w-[clamp(2.5rem,4vw,3.5rem)] h-[clamp(2.5rem,4vw,3.5rem)] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Utensils size={20} className="text-slate-400" />
          )}
        </div>
      ),
      nameDisplay: (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 text-[clamp(0.875rem,1.1vw,1rem)]">
            {item.name}
          </span>
          {item.description ? (
            <p className="text-xs text-slate-500 max-w-xs line-clamp-1">
              {item.description}
            </p>
          ) : (
            <span className="text-xs text-slate-400 italic">No description</span>
          )}
        </div>
      ),
      categoryBadge: (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-secondary-bg)] text-[var(--color-primary)] border border-orange-200">
          {item.categoryName}
        </span>
      ),
      formattedPrice: (
        <span className="font-extrabold text-slate-900 text-[clamp(0.9rem,1.2vw,1.05rem)]">
          Rs {item.basePrice.toLocaleString()}
        </span>
      ),
      stockToggle: (
        <button
          type="button"
          onClick={() => onToggleAvailability(item.id, item.isAvailable)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            item.isAvailable
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
          }`}
          title="Click to toggle item ON/OFF on POS screens"
        >
          {item.isAvailable ? (
            <>
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Available (ON)</span>
            </>
          ) : (
            <>
              <XCircle size={15} className="text-rose-600" />
              <span>Out of Stock (OFF)</span>
            </>
          )}
        </button>
      ),
    }));
  }, [items, onToggleAvailability]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <Card variant="white" className="border border-slate-200 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Search Input */}
          <div>
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              options={categoryFilterOptions}
              value={selectedCategoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
            />
          </div>

          {/* Stock Status Filter */}
          <div>
            <Select
              options={[
                { value: "ALL", label: "All Stock Statuses" },
                { value: "AVAILABLE", label: "Available (ON POS)" },
                { value: "OUT_OF_STOCK", label: "Out of Stock (OFF POS)" },
              ]}
              value={stockStatusFilter}
              onChange={(e) =>
                onStockStatusFilterChange(
                  e.target.value as "ALL" | "AVAILABLE" | "OUT_OF_STOCK"
                )
              }
            />
          </div>
        </div>
      </Card>

      {/* Menu Items Table */}
      <DataTable
        heading="All Food Menu Items"
        TableHeaders={itemTableHeaders}
        TableData={formattedItems}
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={totalEntries}
        onPageChange={onPageChange}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-slate-700" />,
            text: "Edit Item",
            className: "bg-slate-100 hover:bg-slate-200",
            onClick: (row) => onEdit(row as unknown as MenuItemData),
          },
          {
            icon: <Trash2 size={16} className="text-rose-600" />,
            text: "Delete Item",
            className: "bg-rose-50 hover:bg-rose-100",
            onClick: (row) =>
              onDelete(
                (row as unknown as MenuItemData).id,
                (row as unknown as MenuItemData).name
              ),
          },
        ]}
      />
    </div>
  );
}
