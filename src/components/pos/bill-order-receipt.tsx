"use client";

import { CartItem } from "@/types/pos";
import { CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onPrint?: () => void;
  isPrintOnly?: boolean;
}

export function BillOrderReceipt({
  orderCompletedResult,
  billItems,
  totalAmount,
  onPrint,
  isPrintOnly = false,
}: BillOrderReceiptProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const receiptContent = (
    <div className="p-5 bg-white text-slate-900 text-[0.72rem] leading-relaxed font-mono space-y-3 select-text w-full max-w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
        <div className="inline-flex p-2 rounded-full bg-slate-100 text-slate-800 mb-1">
          Logo
        </div>
        <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">
          GOURMET BISTRO
        </h2>
      </div>

      {/* Receipt Info */}
      <div className="space-y-0.5 text-[0.68rem] text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-500">Order #:</span>
          <span className="font-bold text-slate-900">
            {orderCompletedResult.orderNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date/Time:</span>
          <span>{orderCompletedResult.createdAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cashier:</span>
          <span>{orderCompletedResult.cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Pay Mode:</span>
          <span className="font-bold">
            {orderCompletedResult.paymentMethod}
          </span>
        </div>
      </div>

      {/* Items Header */}
      <div className="border-t border-b border-dashed border-slate-300 py-1 font-bold text-slate-800 text-[0.68rem] flex justify-between uppercase">
        <span>Qty Item</span>
        <span>Price</span>
      </div>

      {/* Items List */}
      <div className="space-y-2 py-1">
        {billItems.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between items-start font-medium text-slate-900">
              <span className="pr-2 leading-tight">
                <span className="font-bold">{item.quantity}x</span> {item.name}
              </span>
              <span className="whitespace-nowrap font-bold">
                Rs. {item.itemTotal.toLocaleString()}
              </span>
            </div>
            {item.variant && (
              <p className="text-[0.63rem] text-slate-500 pl-4">
                └ Variant: {item.variant.name}
                {item.variant.priceOffset > 0 &&
                  ` (+Rs. ${item.variant.priceOffset})`}
              </p>
            )}
            {item.addOns && item.addOns.length > 0 && (
              <div className="text-[0.63rem] text-slate-500 pl-4">
                {item.addOns.map((addon) => (
                  <p key={addon.id}>
                    └ + {addon.name} (Rs. {addon.price})
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Financial Totals */}
      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[0.72rem]">
        <div className="flex justify-between text-slate-600">
          <span>Sub Total:</span>
          <span>Rs. {totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>GST Tax (Incl.):</span>
          <span>Rs. 0</span>
        </div>
        <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
          <span>NET TOTAL:</span>
          <span className="text-base font-extrabold text-emerald-700">
            Rs. {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payment / Ledger Details */}
      {orderCompletedResult.paymentStatus === "UNPAID" ? (
        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[0.68rem] space-y-1">
          <div className="flex justify-between font-bold text-rose-800 uppercase">
            <span>Payment Status:</span>
            <span>UNPAID (LEDGER)</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-bold">
              {orderCompletedResult.customerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{orderCompletedResult.customerPhone}</span>
          </div>
          <div className="flex justify-between font-black text-rose-900 border-t border-rose-200 pt-1 text-[0.72rem]">
            <span>DUE BALANCE:</span>
            <span>Rs. {orderCompletedResult.dueAmount.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between text-[0.68rem] font-bold text-emerald-700 pt-1">
          <span>PAYMENT STATUS:</span>
          <span>PAID IN FULL</span>
        </div>
      )}
    </div>
  );

  if (isPrintOnly) {
    return receiptContent;
  }

  return (
    <div className="space-y-4 py-2">
      {/* Order Status Banner */}
      <div
        className={cn(
          "p-4 rounded-xl border text-center transition-all shadow-xs",
          orderCompletedResult.paymentStatus === "UNPAID"
            ? "bg-rose-50/80 border-rose-200"
            : "bg-emerald-50/80 border-emerald-200",
        )}
      >
        <div
          className={cn(
            "w-11 h-11 rounded-full text-white flex items-center justify-center mx-auto mb-2 shadow-xs",
            orderCompletedResult.paymentStatus === "UNPAID"
              ? "bg-rose-600"
              : "bg-emerald-600",
          )}
        >
          <CheckCircle2 size={26} />
        </div>
        <h3
          className={cn(
            "text-base font-bold tracking-tight",
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
            "text-xs mt-0.5 font-medium",
            orderCompletedResult.paymentStatus === "UNPAID"
              ? "text-rose-700"
              : "text-emerald-700",
          )}
        >
          Order Number:{" "}
          <span className="font-mono font-bold">
            #{orderCompletedResult.orderNumber}
          </span>
        </p>
      </div>

      {/* Quick Action Button for Printing */}
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={handlePrint}
          icon={<Printer className="w-4 h-4" />}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs rounded-lg shadow-sm cursor-pointer"
        >
          Print Thermal Receipt
        </Button>
      </div>

      {/* Real 80mm POS Thermal Receipt UI */}
      <div className="relative">
        <div className="h-2 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 rounded-t-sm opacity-60" />
        {receiptContent}
      </div>
    </div>
  );
}
