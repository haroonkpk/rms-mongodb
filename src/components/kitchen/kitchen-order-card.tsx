"use client";

import React, { useState, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateKitchenOrderStatus } from "@/actions/kitchen";
import { KitchenOrder, KitchenOrderItem, OrderStatus } from "@/types";
import { formatKotDisplay } from "@/lib/kot";
import { cn } from "@/lib/utils";
import { Clock, Flame, CheckCircle2, AlertTriangle } from "lucide-react";

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export const KitchenOrderCard = memo(function KitchenOrderCard({
  order,
  onStatusChange,
}: KitchenOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [formattedTime, setFormattedTime] = useState("");

  const kotDisplay = formatKotDisplay(order);

  const isClosed = order.status === "COMPLETED" || order.status === "CANCELLED";

  useEffect(() => {
    if (isClosed) return;

    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - createdTime);

      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      const totalMins = Math.floor(diffMs / 60000);

      setElapsedMinutes(totalMins);

      const formatted =
        hours > 0
          ? `${hours.toString().padStart(2, "0")}:${mins
              .toString()
              .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          : `${mins.toString().padStart(2, "0")}:${secs
              .toString()
              .padStart(2, "0")}`;

      setFormattedTime(formatted);
    };

    calculateElapsed();

    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt, isClosed]);

  const handleStatusTransition = async (nextStatus: OrderStatus) => {
    setIsUpdating(true);

    try {
      const res = await updateKitchenOrderStatus(order.id, nextStatus);

      if (res.success) {
        onStatusChange(order.id, nextStatus);
      }
    } catch (err) {
      console.error("Failed to update kitchen status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isDelayed = !isClosed && elapsedMinutes >= 15;

  const isSlow = !isClosed && elapsedMinutes >= 10 && elapsedMinutes < 15;

  /* --------------------------------
     TIMER
  -------------------------------- */

  const renderTimer = () => {
    if (isClosed) {
      return null;
    }

    if (isDelayed) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold bg-rose-50 text-rose-700 animate-pulse">
          <Clock size={13} />
          {formattedTime}
        </span>
      );
    }

    if (isSlow) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-extrabold bg-amber-50 text-[var(--color-pending)]">
          <Clock size={13} />
          {formattedTime}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-bold">
        <Clock size={13} />
        {formattedTime}
      </span>
    );
  };

  /* --------------------------------
     STATUS
  -------------------------------- */

  const statusConfig: Record<
    OrderStatus,
    {
      label: string;
      dot: string;
      text: string;
    }
  > = {
    PENDING: {
      label: "Pending",
      dot: "bg-amber-500",
      text: "text-amber-800",
    },

    PREPARING: {
      label: "Preparing",
      dot: "bg-[var(--color-primary)]",
      text: "text-[var(--color-primary)]",
    },

    READY: {
      label: "Ready",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
    },

    COMPLETED: {
      label: "Completed",
      dot: "bg-slate-400",
      text: "text-slate-600",
    },

    CANCELLED: {
      label: "Cancelled",
      dot: "bg-rose-400",
      text: "text-rose-600",
    },
  };

  const renderStatus = () => {
    const cfg = statusConfig[order.status];

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-extrabold",
          cfg.text,
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />

        {cfg.label}
      </span>
    );
  };

  /* --------------------------------
     HEADER BACKGROUND
  -------------------------------- */

  const headerBg = isDelayed
    ? "bg-rose-50"
    : isSlow
      ? "bg-amber-50"
      : order.status === "PENDING"
        ? "bg-amber-50/60"
        : order.status === "PREPARING"
          ? "bg-rose-50/40"
          : order.status === "READY"
            ? "bg-emerald-50/60"
            : "bg-slate-50";

  return (
    <Card
      variant="white"
      className="p-0 border border-slate-300/90 shadow-2xs mt-10 sm:mt-12 transition-all duration-200 hover:border-[var(--color-primary)]/50 hover:shadow-md h-fit relative overflow-visible!"
    >
      {/* =================================
          HEADER
      ================================= */}
      <div
        className={cn("px-4 pt-5 pb-3.5 relative overflow-visible", headerBg)}
      >
        {/* KOT  */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-18 h-18 bg-emerald-600 text-white   flex flex-col items-center justify-center p-1 text-center">
            <span className="text-xl font-black tracking-tight text-white leading-tight mt-0.5">
              {kotDisplay.replace("KOT ", "")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {/* STATUS */}
          <div className="flex items-center gap-2 min-w-0">
            {renderStatus()}
          </div>

          {/* TIMER */}
          <div className="shrink-0">{renderTimer()}</div>
        </div>
      </div>

      {/* =================================
          CONTENT
      ================================= */}

      <div className="px-4">
        {/* =================================
            ITEMS HEADER
        ================================= */}

        <div className="flex items-center justify-between pt-4 pb-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Order Items
          </h4>

          <span className="text-[0.7rem] font-bold text-slate-500">
            {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {/* =================================
            ITEMS
        ================================= */}

        <div className="pb-3 space-y-3">
          {order.items.map((item: KitchenOrderItem) => (
            <div
              key={item.id}
              className="p-3.5 bg-white border border-slate-200 shadow-xs space-y-2.5 transition-all hover:border-slate-300 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Item Title Badge */}
                  <div
                    className="inline-flex items-center px-3.5 pr-7 py-1.5 bg-[var(--color-primary)]/90 max-w-full"
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 90% 100%, 0 100%)",
                    }}
                  >
                    <h4 className="text-[clamp(0.875rem,1.2vw,1rem)] font-bold text-white truncate">
                      {item.itemName}
                    </h4>
                  </div>

                  {/* Size / Variant Badge */}
                  {item.variant && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                        Size:
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 text-[0.7rem] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/25">
                        {item.variant}
                      </span>
                    </div>
                  )}

                  {/* Bulleted Add-ons List */}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">
                        Add-ons:
                      </span>
                      <ul className="space-y-1 pl-1 text-[0.7rem] text-slate-600">
                        {item.addOns.map((addon, idx) => (
                          <li
                            key={addon.id || idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                              <span className="truncate font-medium">
                                {addon.name}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <div className="mt-1 flex items-start gap-1 text-[0.68rem] bg-amber-50/80 px-2 py-1 text-amber-800 border border-amber-200/50">
                      <span className="font-semibold">Note:</span> {item.notes}
                    </div>
                  )}
                </div>

                {/* Quantity Display */}
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 text-slate-900  font-extrabold">
                    {item.quantity}×
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =================================
          FOOTER ACTION
      ================================= */}

      <div
        className="px-4 pb-4 pt-3 border-t border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {order.status === "PENDING" && (
          <Button
            type="button"
            variant="primary"
            isLoading={isUpdating}
            icon={<Flame size={16} />}
            onClick={() => handleStatusTransition("PREPARING")}
            className="w-full text-sm py-2.5 font-extrabold"
          >
            Start Preparing
          </Button>
        )}

        {order.status === "PREPARING" && (
          <Button
            type="button"
            variant="success"
            isLoading={isUpdating}
            icon={<CheckCircle2 size={16} />}
            onClick={() => handleStatusTransition("READY")}
            className="w-full text-sm py-2.5 text-white! font-extrabold bg-emerald-500!"
          >
            Mark Ready
          </Button>
        )}

        {order.status === "READY" && (
          <Button
            type="button"
            variant="outline"
            isLoading={isUpdating}
            icon={<CheckCircle2 size={16} className="text-emerald-600" />}
            onClick={() => handleStatusTransition("COMPLETED")}
            className="w-full text-sm py-2.5 border-emerald-600! text-emerald-800! hover:bg-emerald-50! font-extrabold"
          >
            Complete & Serve
          </Button>
        )}

        {isClosed && (
          <Button
            type="button"
            variant="outline"
            isLoading={isUpdating}
            onClick={() => handleStatusTransition("PREPARING")}
            className="w-full text-sm py-2.5 text-slate-700 border-slate-300 hover:bg-slate-50 font-bold"
          >
            Re-open to Prep
          </Button>
        )}
      </div>
    </Card>
  );
});
