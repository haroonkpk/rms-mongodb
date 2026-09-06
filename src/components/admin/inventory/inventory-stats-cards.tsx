"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Boxes, DollarSign, AlertTriangle, AlertOctagon } from "lucide-react";
import { InventoryStats } from "@/actions/inventory";

interface InventoryStatsCardsProps {
  stats: InventoryStats | null;
  isLoading?: boolean;
}

export const InventoryStatsCards: React.FC<InventoryStatsCardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const cards = [
    {
      title: "Total Stock Items",
      value: stats ? stats.totalItems : 0,
      formattedValue: stats ? stats.totalItems.toLocaleString() : "0",
      subtext: "Tracked raw ingredients",
      icon: Boxes,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Total Inventory Value",
      value: stats ? stats.totalValuation : 0,
      formattedValue: stats
        ? `PKR ${stats.totalValuation.toLocaleString("en-PK", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : "PKR 0",
      subtext: "Combined cost value",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Low Stock Items",
      value: stats ? stats.lowStockCount : 0,
      formattedValue: stats ? stats.lowStockCount.toString() : "0",
      subtext: "Needs reordering soon",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      title: "Out of Stock Items",
      value: stats ? stats.outOfStockCount : 0,
      formattedValue: stats ? stats.outOfStockCount.toString() : "0",
      subtext: "Critical replenishment needed",
      icon: AlertOctagon,
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(1rem,2vw,1.5rem)]">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            variant="white"
            className="border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline">
                  {isLoading ? (
                    <div className="h-8 bg-slate-200 rounded animate-pulse w-24" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      {card.formattedValue}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${card.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-medium">
              {card.subtext}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
