"use client";

import React, { useState, memo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { updateKitchenOrderStatus } from "@/actions/kitchen";
import { KitchenOrder, OrderStatus } from "@/types";
import {
  Clock,
  User,
  Phone,
  Flame,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  ChefHat,
} from "lucide-react";

interface KitchenTicketModalProps {
  order: KitchenOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (orderId: string, newStatus: OrderStatus) => void;
}

export const KitchenTicketModal = memo(function KitchenTicketModal({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}: KitchenTicketModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const handleStatus = async (status: OrderStatus) => {
    setIsUpdating(true);
    try {
      const res = await updateKitchenOrderStatus(order.id, status);
      if (res.success) {
        onStatusUpdated(order.id, status);
        onClose();
      }
    } catch (err) {
      console.error("[KitchenTicketModal] Error updating status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details #${order.orderNumber}`}
      className="max-w-xl"
    >
      <div className="space-y-4 py-2">
        {/* Header Metadata Summary */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Customer
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <User size={14} className="text-slate-500" />
              {order.customerName || "Walk-in Guest"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Phone
            </span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Phone size={14} className="text-slate-500" />
              {order.customerPhone || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Order Placed At
            </span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Clock size={14} className="text-slate-500" />
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Cashier
            </span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
              <ChefHat size={14} className="text-slate-500" />
              {order.cashierName || "Staff"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Payment Method
            </span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
              <CreditCard size={14} className="text-slate-500" />
              {order.paymentMethod} ({order.paymentStatus})
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase block">
              Current Status
            </span>
            <span className="font-bold text-[var(--color-primary)] mt-0.5 block">
              {order.status}
            </span>
          </div>
        </div>

        {/* Notes Alert */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg text-amber-900 text-sm flex items-start gap-2">
            <FileText size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <strong className="block text-xs uppercase tracking-wide text-amber-800">
                Special Kitchen Instructions:
              </strong>
              <p className="mt-0.5">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Ticket Item List */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-2 uppercase tracking-wide">
            Ordered Items ({order.items.length})
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-3 bg-white flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-extrabold text-xs px-2 py-0.5 rounded">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-slate-900">{item.itemName}</span>
                    {item.variant && (
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {item.variant}
                      </span>
                    )}
                  </div>

                  {item.addOns && item.addOns.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.addOns.map((ad, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          + {ad.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-200 inline-block">
                      Note: {item.notes}
                    </p>
                  )}
                </div>

                <span className="font-semibold text-slate-900 text-sm">
                  ${item.totalPrice.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="!px-4 !py-2 text-xs"
          >
            Close
          </Button>

          {order.status !== "CANCELLED" && (
            <Button
              type="button"
              variant="danger"
              isLoading={isUpdating}
              icon={<XCircle size={15} />}
              onClick={() => handleStatus("CANCELLED")}
              className="!px-3 !py-2 text-xs"
            >
              Cancel Order
            </Button>
          )}

          {order.status === "PENDING" && (
            <Button
              type="button"
              variant="primary"
              isLoading={isUpdating}
              icon={<Flame size={15} />}
              onClick={() => handleStatus("PREPARING")}
              className="!px-4 !py-2 text-xs"
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
              onClick={() => handleStatus("READY")}
              className="!px-4 !py-2 text-xs"
            >
              Mark Ready
            </Button>
          )}

          {order.status === "READY" && (
            <Button
              type="button"
              variant="outline"
              isLoading={isUpdating}
              icon={<CheckCircle2 size={15} className="text-emerald-600" />}
              onClick={() => handleStatus("COMPLETED")}
              className="!px-4 !py-2 text-xs border-emerald-600 text-emerald-800"
            >
              Complete Order
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
});
