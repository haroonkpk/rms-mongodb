"use client";

import React, { useState, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateKitchenOrderStatus } from "@/actions/kitchen";
import { KitchenOrder, KitchenOrderItem, OrderStatus } from "@/types";
import { formatKotDisplay } from "@/lib/kot";
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  User,
  ChefHat,
  Eye,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react";

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails: (order: KitchenOrder) => void;
}

export const KitchenOrderCard = memo(function KitchenOrderCard({
  order,
  onStatusChange,
  onViewDetails,
}: KitchenOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [formattedTime, setFormattedTime] = useState("");

  const kotDisplay = formatKotDisplay(order);

  // Live elapsed timer tick every 10s
  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - createdTime);
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      setElapsedMinutes(mins);
      setFormattedTime(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const toggleItemCompletion = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

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

  // Timer SLA Urgency Badge
  const getTimerBadge = () => {
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.75rem] font-medium bg-slate-100 text-slate-600">
          <Clock size={12} />
          {formattedTime || "00:00"}
        </span>
      );
    }

    if (elapsedMinutes >= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.75rem] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <AlertTriangle size={12} />
          {formattedTime || "15m+"} (DELAYED)
        </span>
      );
    }

    if (elapsedMinutes >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.75rem] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock size={12} />
          {formattedTime} min
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.75rem] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Clock size={12} />
        {formattedTime} min
      </span>
    );
  };

  // Status Badge
  const getStatusBadge = () => {
    switch (order.status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-[var(--color-pending-bg)] text-[var(--color-pending)] border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            PENDING
          </span>
        );
      case "PREPARING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Flame size={12} className="text-indigo-600 animate-bounce" />
            PREPARING
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-emerald-300">
            <CheckCircle2 size={12} />
            READY
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-semibold bg-red-100 text-red-700 border border-red-300">
            CANCELLED
          </span>
        );
    }
  };

  const allItemsChecked =
    order.items.length > 0 &&
    order.items.every((item) => completedItemIds[item.id]);

  return (
    <Card
      variant="white"
      className={`border flex flex-col justify-between rounded-[clamp(0.625rem,1vw,1rem)] transition-all duration-200 shadow-xs hover:shadow-md p-[clamp(0.875rem,1.2vw,1.125rem)] ${
        order.status === "PENDING"
          ? "border-amber-300/80 bg-amber-50/10 hover:border-amber-400"
          : order.status === "PREPARING"
          ? "border-indigo-300/80 bg-indigo-50/10 hover:border-indigo-400"
          : order.status === "READY"
          ? "border-emerald-300/80 bg-emerald-50/10 hover:border-emerald-400"
          : "border-slate-200 opacity-80"
      }`}
    >
      <div>
        {/* Ticket Header: Top row displaying KOT # and status */}
        <div className="pb-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[clamp(1.05rem,1.3vw,1.2rem)] font-black text-slate-900 tracking-tight bg-slate-900 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                {kotDisplay}
              </span>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {getTimerBadge()}
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                title="View ticket details"
                aria-label={`View details for ${kotDisplay}`}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>

          {/* Sub-header info: Customer & Cashier */}
          {(order.customerName || order.cashierName) && (
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              {order.customerName && (
                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[140px]">
                  <User size={12} className="text-slate-400 shrink-0" />
                  {order.customerName}
                </span>
              )}
              {order.cashierName && (
                <span className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[140px]">
                  <ChefHat size={12} className="text-slate-400 shrink-0" />
                  {order.cashierName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Order Notes Banner */}
        {order.notes && (
          <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs flex items-start gap-1.5 font-medium">
            <FileText size={14} className="shrink-0 text-amber-700 mt-0.5" />
            <span>
              <strong className="font-bold">Note:</strong> {order.notes}
            </span>
          </div>
        )}

        {/* Minimal Item List */}
        <div className="py-2.5 space-y-2">
          {order.items.map((item: KitchenOrderItem) => {
            const isItemChecked = Boolean(completedItemIds[item.id]);

            return (
              <div
                key={item.id}
                onClick={(e) => toggleItemCompletion(item.id, e)}
                className={`p-2 rounded-md border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                  isItemChecked
                    ? "bg-slate-100/70 border-slate-200 text-slate-400 line-through opacity-65"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs"
                }`}
              >
                {/* Item Checkbox */}
                <div className="shrink-0 text-slate-400 mt-0.5">
                  {isItemChecked ? (
                    <CheckSquare size={16} className="text-emerald-600" />
                  ) : (
                    <Square size={16} className="hover:text-slate-600" />
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1.5">
                    <span className="font-bold text-[clamp(0.875rem,1vw,0.95rem)] leading-snug">
                      <span className="inline-block bg-slate-900 text-white text-[0.7rem] font-black px-1.5 py-0.2 rounded mr-1.5">
                        {item.quantity}x
                      </span>
                      {item.itemName}
                    </span>
                    {item.variant && (
                      <span className="text-[0.7rem] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 shrink-0">
                        {item.variant}
                      </span>
                    )}
                  </div>

                  {/* Add-ons */}
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.addOns.map((addon, idx) => (
                        <span
                          key={idx}
                          className="text-[0.7rem] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded"
                        >
                          + {addon.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <p className="text-[0.7rem] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded mt-1 border border-amber-200 inline-block">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {order.status === "PENDING" && (
          <Button
            type="button"
            variant="primary"
            isLoading={isUpdating}
            icon={<Flame size={15} />}
            onClick={() => handleStatusTransition("PREPARING")}
            className="w-full text-xs py-2 !rounded-md font-bold"
          >
            Start Preparing
          </Button>
        )}

        {order.status === "PREPARING" && (
          <Button
            type="button"
            variant="success"
            isLoading={isUpdating}
            icon={<CheckCircle2 size={15} />}
            onClick={() => handleStatusTransition("READY")}
            className="w-full text-xs py-2 !rounded-md font-bold"
          >
            {allItemsChecked ? "Mark Ready (All Done)" : "Mark Ready"}
          </Button>
        )}

        {order.status === "READY" && (
          <Button
            type="button"
            variant="outline"
            isLoading={isUpdating}
            icon={<CheckCircle2 size={15} className="text-emerald-600" />}
            onClick={() => handleStatusTransition("COMPLETED")}
            className="w-full text-xs py-2 border-emerald-600 text-emerald-800 hover:bg-emerald-50 !rounded-md font-bold"
          >
            Complete & Serve
          </Button>
        )}

        {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
          <Button
            type="button"
            variant="outline"
            isLoading={isUpdating}
            onClick={() => handleStatusTransition("PREPARING")}
            className="w-full text-xs py-2 text-slate-600 border-slate-300 hover:bg-slate-50 !rounded-md"
          >
            Re-open to Prep
          </Button>
        )}
      </div>
    </Card>
  );
});
