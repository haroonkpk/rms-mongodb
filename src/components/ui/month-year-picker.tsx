"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  month: number; // 1 - 12
  year: number;
  onChange: (month: number, year: number) => void;
  label?: string;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

export function MonthYearPicker({
  month,
  year,
  onChange,
  label,
  className,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(year);
  }, [year]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMonth = (mIndex: number) => {
    onChange(mIndex + 1, viewYear);
    setIsOpen(false);
  };

  const selectedMonthName = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
  });

  return (
    <div className={cn("flex flex-col gap-[clamp(0.3rem,1vw,0.5rem)] relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-[clamp(0.7rem,1vw,0.8rem)] font-bold text-[#475569] uppercase tracking-wide cursor-pointer">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-[var(--color-page-bg)] text-[#1E293B]",
          "border border-slate-200 rounded-lg p-[clamp(0.6rem,1.5vw,0.875rem)] text-sm font-semibold shadow-2xs transition-all duration-200",
          "hover:bg-white hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20",
          isOpen && "bg-white border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-[var(--color-primary)]" />
          <span>{selectedMonthName} {year}</span>
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="font-bold text-slate-900 text-base">
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Months 3x4 Grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((mName, idx) => {
              const isSelected = month === idx + 1 && year === viewYear;
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={cn(
                    "py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-[var(--color-primary)] text-white shadow-xs scale-105"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
