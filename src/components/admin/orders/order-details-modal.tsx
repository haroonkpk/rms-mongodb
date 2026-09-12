"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getOrderDetails } from "@/actions/reports";

export type OrderDetails = NonNullable<
  Awaited<ReturnType<typeof getOrderDetails>>
>;

const money = (value: number) => `PKR ${Math.round(value).toLocaleString()}`;

export function OrderDetailsModal({
  order,
  onClose,
}: {
  order: OrderDetails | null;
  onClose: () => void;
}) {
  if (!order) return null;

  const customerDetailRows = [
    {
      label: "Customer",
      value: order.customerName || "Walk-in",
      className: "font-semibold text-slate-800",
    },
    {
      label: "Phone",
      value: order.customerPhone || "-",
      className: "font-semibold text-slate-800",
    },
  ];
  const orderDetailRows = [
    {
      label: "Order Date",
      value: new Date(order.date).toLocaleString("en-GB"),
      className: "text-slate-800",
    },
    {
      label: "Cashier",
      value: order.cashier,
      className: "font-semibold text-slate-800",
    },
    {
      label: "Payment",
      value: `${order.paymentMethod} / ${order.paymentStatus}`,
      className: "font-semibold text-slate-800",
    },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      className="max-h-[90vh] max-w-3xl overflow-y-auto"
    >
      <div className="flex flex-col gap-5 text-sm">
        <section>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
            Customer Details
          </h4>
          <div className="divide-y divide-slate-200 bg-slate-50 px-4">
            {customerDetailRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
            Order Details
          </h4>
          <div className="mb-4 divide-y divide-slate-200 bg-slate-50 px-4">
            {orderDetailRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-155 text-left">
              <thead className="border-y border-(--color-secondary-bg) bg-(--color-page-bg) text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr
                    key={`${item.name}-${index}`}
                    className="border-b border-(--color-secondary-bg)"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className="h-12 w-12 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center bg-slate-100 text-xs text-slate-400">
                            No image
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">
                            {item.name}
                            {item.variant && (
                              <span className="ml-1 text-xs text-slate-500">
                                ({item.variant})
                              </span>
                            )}
                          </p>
                          {item.addOns && (
                            <p className="text-xs text-slate-500">
                              Add-ons: {item.addOns}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-slate-500">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{item.quantity}</td>
                    <td className="px-3 py-3">{money(item.unitPrice)}</td>
                    <td className="px-3 py-3 text-right font-bold">
                      {money(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="ml-auto w-full max-w-xs border-t border-(--color-secondary-bg) pt-3">
          <div className="flex justify-between text-lg">
            <span>Total</span>
            <strong>{money(order.totalAmount)}</strong>
          </div>
          {order.dueAmount > 0 && (
            <div className="mt-2 flex justify-between font-bold text-rose-700">
              <span>Due</span>
              <span>{money(order.dueAmount)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-2 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className={`text-right ${className}`}>{value}</span>
    </div>
  );
}
