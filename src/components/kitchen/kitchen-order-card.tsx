"use client";

import React, { useState, useEffect, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateKitchenOrderStatus } from "@/actions/kitchen";
import { KitchenOrder, KitchenOrderItem, OrderStatus } from "@/types";
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

  // Live timer tick every 10s
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

  // SLA Urgency Timer Styling
  const getTimerBadge = () => {
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
          <Clock size={13} />
          {formattedTime || "00:00"}
        </span>
      );
    }

    if (elapsedMinutes >= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <AlertTriangle size={13} />
          {formattedTime || "15m+"} (DELAYED)
        </span>
      );
    }

    if (elapsedMinutes >= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock size={13} />
          {formattedTime} min
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Clock size={13} />
        {formattedTime} min
      </span>
    );
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-pending-bg)] text-[var(--color-pending)] border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            PENDING
          </span>
        );
      case "PREPARING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Flame size={13} className="text-indigo-600 animate-bounce" />
            PREPARING
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-emerald-300">
            <CheckCircle2 size={13} />
            READY
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
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
      className={`border flex flex-col justify-between rounded-[clamp(0.5rem,1vw,0.875rem)] transition-all duration-200 shadow-xs hover:shadow-md ${
        order.status === "PENDING"
          ? "border-amber-300 bg-amber-50/20"
          : order.status === "PREPARING"
          ? "border-indigo-300 bg-indigo-50/20"
          : order.status === "READY"
          ? "border-emerald-300 bg-emerald-50/20"
          : "border-slate-200 opacity-80"
      }`}
    >
      <div>
        {/* Ticket Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[clamp(1rem,1.4vw,1.15rem)] font-extrabold text-slate-900 tracking-tight">
                #{order.orderNumber}
              </span>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              {order.customerName && (
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <User size={12} />
                  {order.customerName}
                </span>
              )}
              {order.cashierName && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <ChefHat size={12} />
                  {order.cashierName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {getTimerBadge()}
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="text-slate-400 hover:text-[var(--color-primary)] transition-colors p-1 rounded-md hover:bg-slate-100"
              title="View ticket details"
              aria-label={`View details for order ${order.orderNumber}`}
            >
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* Notes Banner */}
        {order.notes && (
          <div className="mt-2.5 p-2 bg-amber-100/70 border border-amber-300 rounded-md text-amber-900 text-xs flex items-start gap-1.5 font-medium">
            <FileText size={14} className="shrink-0 text-amber-700 mt-0.5" />
            <span>
              <strong>Order Note:</strong> {order.notes}
            </span>
          </div>
        )}

        {/* Items List */}
        <div className="py-3 space-y-2.5">
          {order.items.map((item: KitchenOrderItem) => {
            const isItemChecked = Boolean(completedItemIds[item.id]);

            return (
              <div
                key={item.id}
                onClick={(e) => toggleItemCompletion(item.id, e)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isItemChecked
                    ? "bg-slate-100 border-slate-200 text-slate-400 line-through opacity-70"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                }`}
              >
                {/* Item Checkbox */}
                <div className="shrink-0 text-slate-400 mt-0.5">
                  {isItemChecked ? (
                    <CheckSquare size={18} className="text-emerald-600" />
                  ) : (
                    <Square size={18} className="hover:text-slate-600" />
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-[clamp(0.9rem,1.1vw,1rem)] leading-snug">
                      <span className="inline-block bg-slate-900 text-white text-xs font-black px-1.5 py-0.5 rounded-md mr-1.5">
                        {item.quantity}x
                      </span>
                      {item.itemName}
                    </span>
                    {item.variant && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
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
                          className="text-[0.75rem] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded"
                        >
                          + {addon.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-200 inline-block">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {order.status === "PENDING" && (
          <Button
            type="button"
            variant="primary"
            isLoading={isUpdating}
            icon={<Flame size={16} />}
            onClick={() => handleStatusTransition("PREPARING")}
            className="w-full text-xs py-2 !rounded-md"
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
            className="w-full text-xs py-2 !rounded-md"
          >
            {allItemsChecked ? "Mark Ready (All Done)" : "Mark Ready"}
          </Button>
        )}

        {order.status === "READY" && (
          <Button
            type="button"
            variant="outline"
            isLoading={isUpdating}
            icon={<CheckCircle2 size={16} className="text-emerald-600" />}
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
