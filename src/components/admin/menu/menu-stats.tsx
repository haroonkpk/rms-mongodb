"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Utensils, CheckCircle2, XCircle, Layers } from "lucide-react";

interface MenuStatsProps {
  totalItems: number;
  availableCount: number;
  outOfStockCount: number;
  categoryCount: number;
}

export function MenuStats({
  totalItems,
  availableCount,
  outOfStockCount,
  categoryCount,
}: MenuStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
      <Card
        variant="white"
        className="border border-slate-200 flex items-center gap-4 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-xl bg-orange-100 text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <Utensils size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Items
          </p>
          <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-slate-900">
            {totalItems}
          </h3>
        </div>
      </Card>

      <Card
        variant="white"
        className="border border-slate-200 flex items-center gap-4 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Available on POS
          </p>
          <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-emerald-700">
            {availableCount}
          </h3>
        </div>
      </Card>

      <Card
        variant="white"
        className="border border-slate-200 flex items-center gap-4 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <XCircle size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Out of Stock
          </p>
          <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-rose-700">
            {outOfStockCount}
          </h3>
        </div>
      </Card>

      <Card
        variant="white"
        className="border border-slate-200 flex items-center gap-4 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Layers size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Categories
          </p>
          <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-slate-900">
            {categoryCount}
          </h3>
        </div>
      </Card>
    </div>
  );
}
