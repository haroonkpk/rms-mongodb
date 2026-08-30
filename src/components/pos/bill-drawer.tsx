"use client";

import React, { useState } from "react";
import { CartItem, POSOrderPayload } from "@/types/pos";
import { createPOSOrder } from "@/actions/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrintPdfButton } from "@/components/shared/print-pdf-button";
import {
  Receipt,
  X,
  Banknote,
  QrCode,
  Printer,
  RotateCcw,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BillItemCard } from "./bill-item-card";
import { BillOrderReceipt, OrderCompletedResult } from "./bill-order-receipt";

interface BillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  billItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
  onClearBill: () => void;
  cashierName?: string;
}

export function BillDrawer({
  isOpen,
  onClose,
  billItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearBill,
  cashierName = "Cashier",
}: BillDrawerProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QR_CODE" | "LEDGER"
  >("CASH");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orderCompletedResult, setOrderCompletedResult] =
    useState<OrderCompletedResult | null>(null);

  const totalAmount = billItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const totalItemCount = billItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const paymentMethods = [
    {
      value: "CASH",
      label: "Cash",
      icon: Banknote,
    },
    {
      value: "QR_CODE",
      label: "QR Code",
      icon: QrCode,
    },
    {
      value: "LEDGER",
      label: "Ledger",
      icon: BookOpen,
    },
  ] as const;

  const handlePlaceOrderAndPrint = async () => {
    if (billItems.length === 0) return;

    // Validation for Full Ledger Orders
    if (paymentMethod === "LEDGER") {
      if (!customerName.trim()) {
        setValidationError(
          "Customer Full Name is required for Customer Ledger (Qarza) orders.",
        );
        return;
      }
      if (!customerPhone.trim()) {
        setValidationError(
          "Customer Phone Number is required for Customer Ledger (Qarza) orders.",
        );
        return;
      }
    }

    setValidationError(null);

    try {
      setIsSubmitting(true);

      const isLedger = paymentMethod === "LEDGER";

      const payload: POSOrderPayload = {
        items: billItems,
        subtotal: totalAmount,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: isLedger ? "UNPAID" : "PAID",
        cashReceived: isLedger ? 0 : totalAmount,
        changeGiven: 0,
        dueAmount: isLedger ? totalAmount : 0,
        customerName: isLedger ? customerName.trim() : undefined,
        customerPhone: isLedger ? customerPhone.trim() : undefined,
        notes: customerNotes.trim() || undefined,
      };

      const res = await createPOSOrder(payload);

      if (res.success && res.orderNumber) {
        setOrderCompletedResult({
          orderNumber: res.orderNumber,
          createdAt: res.createdAt || new Date().toLocaleString(),
          cashierName: res.cashierName || cashierName,
          paymentMethod:
            paymentMethod === "CASH"
              ? "Cash Payment"
              : paymentMethod === "QR_CODE"
                ? "QR Code Digital"
                : "Customer Ledger (Credit)",
          paymentStatus: isLedger ? "UNPAID" : "PAID",
          cashReceived: isLedger ? 0 : totalAmount,
          dueAmount: isLedger ? totalAmount : 0,
          customerName: isLedger ? customerName.trim() : undefined,
          customerPhone: isLedger ? customerPhone.trim() : undefined,
          notes: customerNotes.trim() || undefined,
        });
      } else {
        alert(res.error || "Failed to place order.");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      alert("An error occurred while placing order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewOrder = () => {
    setOrderCompletedResult(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerNotes("");
    setValidationError(null);
    onClearBill();
  };

  // PDF Data formatting for PrintPdfButton
  const pdfHeaders = [
    { key: "item", label: "Item Name" },
    { key: "qty", label: "Qty" },
    { key: "price", label: "Price" },
    { key: "total", label: "Total" },
  ];

  const pdfData = billItems.map((c) => ({
    item: `${c.name}${c.variant ? ` (${c.variant.name})` : ""}`,
    qty: c.quantity,
    price: `Rs. ${c.unitPrice.toLocaleString()}`,
    total: `Rs. ${c.itemTotal.toLocaleString()}`,
  }));

  const pdfSummary = {
    "Total Payable": `Rs. ${totalAmount.toLocaleString()}`,
    "Payment Method":
      paymentMethod === "CASH"
        ? "Cash Payment"
        : paymentMethod === "QR_CODE"
          ? "QR Code Digital"
          : "Customer Ledger (Credit)",
    "Payment Status":
      paymentMethod === "LEDGER" ? "UNPAID (Full Qarza)" : "PAID",
    ...(paymentMethod === "LEDGER"
      ? {
          "Customer Name": customerName,
          "Customer Phone": customerPhone,
          "Due Balance (Qarza)": `Rs. ${totalAmount.toLocaleString()}`,
          ...(customerNotes ? { "Ledger Note": customerNotes } : {}),
        }
      : {
          "Payment Received": `Rs. ${totalAmount.toLocaleString()}`,
        }),
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dim Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-2xs transition-opacity"
      />

      {/* Side Slide-Out Bill Drawer */}
      <aside
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[clamp(40rem,45vw,38rem)] bg-(--color-page-bg) border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-[clamp(1rem,1.5vw,1.25rem)] py-[clamp(0.875rem,1.2vw,1rem)] border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 text-[var(--color-primary)] flex items-center justify-center font-bold">
              <Receipt size={26} />
            </div>
            <div>
              <h2 className="text-[1rem] font-bold text-slate-900 leading-tight">
                Current Order Bill
              </h2>
              <p className="text-[0.7rem] text-slate-500 font-medium">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"} in
                bill
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {billItems.length > 0 && !orderCompletedResult && (
              <button
                onClick={onClearBill}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-[clamp(1rem,1.5vw,1.25rem)] space-y-4">
          {!orderCompletedResult ? (
            <>
              {/* Bill Items List */}
              {billItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Receipt size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Bill is empty
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Select items from menu grid to add to customer bill.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billItems.map((item) => (
                    <BillItemCard
                      key={item.cartItemId}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemoveItem={onRemoveItem}
                    />
                  ))}
                </div>
              )}

              {/* Integrated Payment Method & Ledger Section */}
              {billItems.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Payment Method
                    </label>
                    {paymentMethod === "LEDGER" && (
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200">
                        Pay Later
                      </span>
                    )}
                  </div>
                  {/* Payment Buttons Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isLedger = method.value === "LEDGER";
                      const isSelected = paymentMethod === method.value;

                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method.value);
                            setValidationError(null);
                          }}
                          className={cn(
                            "p-2.5 border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-[0.72rem] font-bold text-center",

                            isSelected
                              ? isLedger
                                ? "border-rose-600 bg-rose-600 text-white shadow-2xs"
                                : "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-2xs"
                              : isLedger
                                ? "border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100/60"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          <Icon size={18} />
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* LEDGER: Customer Details Input Form  */}
                  {paymentMethod === "LEDGER" && (
                    <div className="p-3.5 bg-white border border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          Customer Details
                        </span>
                        <span className="text-[0.65rem] font-bold text-rose-700">
                          Due: Rs. {totalAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Customer Full Name */}
                      <Input
                        label="Customer Full Name"
                        required
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="e.g. Muhammad Ali"
                      />

                      {/* Customer Phone Number */}
                      <Input
                        label="Customer Phone Number"
                        required
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (validationError) setValidationError(null);
                        }}
                        placeholder="e.g. 0300-1234567"
                      />

                      {/* Ledger Note */}
                      <Textarea
                        label="Ledger / Credit Note (Optional)"
                        rows={2}
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Optional credit note or promise date..."
                      />

                      {validationError && (
                        <p className="text-[0.68rem] font-bold text-rose-600 flex items-center gap-1  p-2 ">
                          <AlertCircle
                            size={13}
                            className="shrink-0 text-rose-600"
                          />
                          {validationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Order Placed Receipt Screen */
            <BillOrderReceipt
              orderCompletedResult={orderCompletedResult}
              billItems={billItems}
              totalAmount={totalAmount}
            />
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-[clamp(1rem,1.5vw,1.25rem)] border-t border-slate-200 bg-white space-y-3 shrink-0">
          {!orderCompletedResult ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Bill
                </span>
                <span className="text-2xl font-black text-[var(--color-primary)]">
                  Rs. {totalAmount.toLocaleString()}
                </span>
              </div>

              <Button
                variant="primary"
                disabled={billItems.length === 0}
                onClick={handlePlaceOrderAndPrint}
                isLoading={isSubmitting}
                icon={<Printer className="w-4 h-4" />}
                className={cn(
                  "w-full text-white py-3 font-bold! text-[1rem]! rounded-[clamp(0.3rem,0.35vw,0.3rem)] cursor-pointer transition-colors",
                  paymentMethod === "LEDGER"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                )}
              >
                {paymentMethod === "LEDGER"
                  ? "Record Ledger Order & Print"
                  : "Place Order & Print"}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <PrintPdfButton
                title={`Receipt - ${orderCompletedResult.orderNumber}`}
                subtitle={`Cashier: ${orderCompletedResult.cashierName} | Payment: ${orderCompletedResult.paymentMethod}`}
                headers={pdfHeaders}
                data={pdfData}
                summary={pdfSummary}
                fileName={`Receipt_${orderCompletedResult.orderNumber}`}
                variant="primary"
              />

              <Button
                variant="outline"
                onClick={handleResetForNewOrder}
                icon={<RotateCcw className="w-4 h-4" />}
                className="w-full text-xs py-2.5 font-semibold cursor-pointer"
              >
                Start New Order
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
