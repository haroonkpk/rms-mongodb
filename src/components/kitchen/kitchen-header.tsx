"use client";

import React, { memo } from "react";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { KitchenStats } from "@/types";
import { cn } from "@/lib/utils";

interface KitchenHeaderProps {
  stats: KitchenStats;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  realtimeStatus: "connected" | "connecting" | "polling" | "disconnected";
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export const KitchenHeader = memo(function KitchenHeader({
  stats,
  isSoundEnabled,
  onToggleSound,
  onRefresh,
  isRefreshing,
  realtimeStatus,
  activeFilter,
  onFilterChange,
}: KitchenHeaderProps) {
  const getRealtimeBadge = () => {
    switch (realtimeStatus) {
      case "connected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi size={13} className="text-emerald-600" />
            Live
          </span>
        );
      case "polling":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw size={13} className="animate-spin text-amber-600" />
            Auto-Sync
          </span>
        );
      case "connecting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw size={13} className="animate-spin text-blue-600" />
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <WifiOff size={13} className="text-slate-400" />
            Offline
          </span>
        );
    }
  };

  const filterOptions = [
    { id: "ALL_ACTIVE", label: "All Active", count: stats.totalActive },
    { id: "PENDING", label: "Pending", count: stats.pendingCount },
    { id: "PREPARING", label: "Preparing", count: stats.preparingCount },
    { id: "READY", label: "Ready", count: stats.readyCount },
    { id: "COMPLETED", label: "Completed", count: stats.completedTodayCount },
  ];

  return (
    <header className="space-y-[clamp(0.75rem,1.5vw,1.25rem)] mb-[clamp(1rem,2vw,1.5rem)]">
      {/* Top Heading */}
      <div>
        <Header title="Kitchen Display System (KDS)" />
      </div>

      {/* Control Ribbon */}
      <div className="bg-white border border-slate-200 p-[clamp(0.5rem,1vw,0.75rem)]  flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 overflow-x-auto ">
        {/* Status-based Filters Only */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5">
          {filterOptions.map((item) => {
            const isActive = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange(item.id)}
                className={cn(
                  "flex items-center gap-2 px-[clamp(0.75rem,1.25vw,1rem)] py-[clamp(0.4rem,0.8vw,0.6rem)] text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer outline-none ",
                  isActive
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                )}
              >
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls: Realtime Indicator, Sound Button, Refresh Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
          {getRealtimeBadge()}

          <Button
            type="button"
            variant="outline"
            onClick={onToggleSound}
            icon={
              isSoundEnabled ? (
                <Volume2 size={15} className="text-emerald-600" />
              ) : (
                <VolumeX size={15} className="text-slate-400" />
              )
            }
            className="!px-3 !py-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            title={
              isSoundEnabled
                ? "Sound Alerts Active (Click to Mute)"
                : "Sound Muted (Click to Unmute)"
            }
            aria-label="Toggle Sound Alert"
          ></Button>

          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            isLoading={isRefreshing}
            icon={
              <RefreshCw
                size={15}
                className={isRefreshing ? "animate-spin" : ""}
              />
            }
            className="!px-3 !py-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Refresh Orders"
          ></Button>
        </div>
      </div>
    </header>
  );
});
