"use client";

import React from "react";
import { POSCategory } from "@/types/pos";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface CategoryTabsProps {
  categories: POSCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  totalAllItemsCount: number;
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalAllItemsCount,
}: CategoryTabsProps) {
  return (
    <div className="w-full mb-[clamp(1rem,2vw,1.5rem)]">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5">
        {/* 'All Items' Tab */}
        <button
          type="button"
          onClick={() => onSelectCategory("ALL")}
          className={cn(
            "flex items-center gap-2 px-[clamp(0.875rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vw,0.75rem)]  text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer outline-none border shadow-2xs",
            selectedCategoryId === "ALL"
              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-[1.02]"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Items</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold",
              selectedCategoryId === "ALL"
                ? "bg-white/25 text-white"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {totalAllItemsCount}
          </span>
        </button>

        {/* Dynamic Categories Tabs */}
        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-[clamp(0.875rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vw,0.75rem)] text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer outline-none border shadow-2xs",
                isActive
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
              )}
            >
              <span>{cat.name}</span>
              {cat.itemCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {cat.itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
