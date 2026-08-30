"use client";

import React from "react";
import { CartItem } from "@/types/pos";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderCompletedResult {
  orderNumber: string;
  createdAt: string;
  cashierName: string;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID";
  cashReceived: number;
  dueAmount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

interface BillOrderReceiptProps {
  orderCompletedResult: OrderCompletedResult;
  billItems: CartItem[];
  totalAmount: number;
}

export function BillOrderReceipt({
  orderCompletedResult,
  billItems,
  totalAmount,
}: BillOrderReceiptProps) {
  return (
    <div className="space-y-4 py-4">
      <div
        className={cn(
          "p-4 rounded-[clamp(0.5rem,1vw,0.75rem)] border text-center",
          orderCompletedResult.paymentStatus === "UNPAID"
            ? "bg-rose-50 border-rose-200"
            : "bg-emerald-50 border-emerald-200",
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full text-white flex items-center justify-center mx-auto mb-2 shadow-xs",
            orderCompletedResult.paymentStatus === "UNPAID"
              ? "bg-rose-600"
              : "bg-emerald-500",
          )}
        >
          <CheckCircle2 size={24} />
        </div>
        <h3
          className={cn(
            "text-base font-bold",
            orderCompletedResult.paymentStatus === "UNPAID"
              ? "text-rose-900"
              : "text-emerald-900",
          )}
        >
          {orderCompletedResult.paymentStatus === "UNPAID"
            ? "Ledger Order Recorded!"
            : "Order Placed Successfully!"}
        </h3>
        <p
          className={cn(
            "text-xs mt-0.5",
            orderCompletedResult.paymentStatus === "UNPAID"
              ? "text-rose-700"
              : "text-emerald-700",
          )}
        >
          Order Number:{" "}
          <span className="font-bold">
            {orderCompletedResult.orderNumber}
          </span>
        </p>
      </div>

      {/* Receipt Box */}
      <div className="p-4 bg-white border border-slate-200 rounded-[clamp(0.5rem,1vw,0.75rem)] text-xs text-slate-700 space-y-2 font-mono">
        <div className="text-center border-b border-dashed border-slate-300 pb-2">
          <h4 className="font-bold text-sm text-slate-900">
            RESTAURANT MANAGEMENT
          </h4>
          <p className="text-[0.65rem] text-slate-400">
            {orderCompletedResult.createdAt}
          </p>
        </div>

        <div className="flex justify-between text-[0.7rem]">
          <span>Receipt #: {orderCompletedResult.orderNumber}</span>
          <span>Cashier: {orderCompletedResult.cashierName}</span>
        </div>

        <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
          {billItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="truncate max-w-[12rem]">
                {item.quantity}x {item.name}
              </span>
              <span>Rs. {item.itemTotal.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 pt-1 text-xs">
          <div className="flex justify-between font-bold text-sm text-slate-900">
            <span>Total Amount:</span>
            <span>Rs. {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[0.72rem] text-slate-600">
            <span>Payment Method:</span>
            <span className="font-semibold">
              {orderCompletedResult.paymentMethod}
            </span>
          </div>

          {orderCompletedResult.paymentStatus === "UNPAID" ? (
            <div className="space-y-1 pt-1 bg-rose-50 p-2 rounded border border-rose-200">
              <div className="flex justify-between font-bold text-rose-700">
                <span>Payment Status:</span>
                <span>UNPAID</span>
              </div>
              <div className="flex justify-between text-[0.7rem] text-rose-800">
                <span>Customer Name:</span>
                <span className="font-bold">
                  {orderCompletedResult.customerName}
                </span>
              </div>
              <div className="flex justify-between text-[0.7rem] text-rose-800">
                <span>Customer Phone:</span>
                <span className="font-bold">
                  {orderCompletedResult.customerPhone}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-xs text-rose-900 border-t border-rose-200 pt-1">
                <span>Due Balance:</span>
                <span>
                  Rs. {orderCompletedResult.dueAmount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-[0.72rem] text-emerald-700">
              <span>Status:</span>
              <span className="font-semibold">PAID</span>
            </div>
          )}
        </div>

        {orderCompletedResult.notes && (
          <div className="pt-2 border-t border-dashed border-slate-200 text-[0.68rem] text-slate-600 italic">
            <span className="font-bold not-italic">Ledger Note: </span>
            {orderCompletedResult.notes}
          </div>
        )}
      </div>
    </div>
  );
}
