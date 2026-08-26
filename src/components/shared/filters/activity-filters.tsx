"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  id: string;
  label?: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
}

export interface ActivityFiltersProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  selectFilters?: FilterSelectConfig[];
  onClearFilters?: () => void;
  isFilterActive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function ActivityFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel,
  selectFilters = [],
  onClearFilters,
  isFilterActive,
  children,
  className = "",
}: ActivityFiltersProps) {
  const computedIsActive =
    isFilterActive !== undefined
      ? isFilterActive
      : Boolean(
          (searchQuery && searchQuery.trim() !== "") ||
          selectFilters.some(
            (f) => f.value && f.value !== "ALL" && f.value !== "",
          ),
        );

  return (
    <Card
      variant="white"
      className={`border border-slate-200 p-4 shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
          {onSearchChange && (
            <div>
              <Input
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}

          {selectFilters.map((filter) => (
            <div key={filter.id}>
              <Select
                label={filter.label}
                options={filter.options}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
              />
            </div>
          ))}

          {children}
        </div>

        {onClearFilters && (
          <Button
            type="button"
            variant="outline"
            icon={<FilterX size={18} />}
            onClick={onClearFilters}
            disabled={!computedIsActive}
            className={`!px-3 !py-2.5 shrink-0 ${
              !computedIsActive
                ? "opacity-50 cursor-not-allowed"
                : "bg-red-600! text-white"
            }`}
            title="Clear all filters"
            aria-label="Clear all filters"
          />
        )}
      </div> 
    </Card>
  );
}

// Alias for generic usage
export const DataFilter = ActivityFilters;
