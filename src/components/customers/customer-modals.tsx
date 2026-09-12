"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable, TableHeader } from "@/components/ui/data-table";

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  dueAmount: number;
  paymentStatus: "PAID" | "UNPAID";
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  type: "CHARGE" | "PAYMENT";
  amount: number;
  note: string | null;
  orderNumber: string | null;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
  totalOrders: number;
  ledgerBalance: number;
  createdAt: string;
  orders: CustomerOrder[];
  ledgerEntries: CustomerLedgerEntry[];
}

const money = (value: number) => `Rs. ${value.toLocaleString()}`;

const ledgerOrderHeaders: TableHeader[] = [
  { key: "orderNumber", label: "Order" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "due", label: "Due" },
];

export function CustomerFormModal({
  customer,
  onClose,
  onSave,
  isPending,
}: {
  customer: CustomerRecord | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    status: "ACTIVE" | "INACTIVE";
  }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    customer?.status ?? "ACTIVE",
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={customer ? "Edit Customer" : "Create Customer"}
      className="max-w-xl h-[90vh] overflow-y-auto"
    >
      <form
        className="space-y-4 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ name, phone, email, notes, status });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Phone"
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <Input
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {customer && (
          <Select
            label="Status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "ACTIVE" | "INACTIVE")
            }
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {customer ? "Save changes" : "Create customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function CustomerDetailsModal({
  customer,
  onClose,
  onPayment,
  isPending,
}: {
  customer: CustomerRecord | null;
  onClose: () => void;
  onPayment: (amount: number, note: string) => Promise<void>;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  if (!customer) return null;

  const customerDetailRows = [
    {
      label: "Customer",
      value: customer.name,
      valueClass: "font-semibold text-slate-800",
    },
    {
      label: "Phone",
      value: customer.phone,
      valueClass: "font-semibold text-slate-800",
    },
    {
      label: "Status",
      value: customer.status,
      valueClass: "font-semibold text-slate-800",
    },
    {
      label: "Total Orders",
      value: customer.totalOrders,
      valueClass: "font-semibold text-slate-800",
    },
    {
      label: "Current Ledger Balance",
      value: money(customer.ledgerBalance),
      valueClass: `font-bold ${customer.ledgerBalance > 0 ? "text-rose-600" : "text-emerald-600"}`,
    },
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Customer Details"
      className="max-w-3xl h-[90vh] overflow-y-auto"
    >
      <div className="space-y-5 py-2">
        <section>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-800">
            Customer Details
          </h4>
          <div className="divide-y divide-slate-200 bg-slate-50 px-4">
            {customerDetailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 px-2 py-3"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {row.label}
                </span>
                <span className={`text-right ${row.valueClass}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border border-slate-200 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <CreditCard size={16} /> Record payment
            </h4>
            <div className="space-y-3">
              <Input
                label="Amount"
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
              />
              <Input
                label="Note (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Cash received"
              />
              <Button
                className="w-full"
                isLoading={isPending}
                disabled={!amount || Number(amount) <= 0}
                onClick={() => {
                  void onPayment(Number(amount), note);
                  setAmount("");
                  setNote("");
                }}
              >
                Record payment
              </Button>
            </div>
          </Card>
          <div>
            <h4 className="mb-2 text-sm font-bold text-slate-800">
              Ledger / Payment History
            </h4>
            <div className="max-h-64 overflow-y-auto border border-slate-200">
              {customer.ledgerEntries.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  No ledger history yet.
                </p>
              ) : (
                customer.ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {entry.type === "CHARGE"
                          ? "Ledger charge"
                          : "Payment received"}
                        {entry.orderNumber ? ` · ${entry.orderNumber}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}{" "}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${entry.type === "CHARGE" ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {entry.type === "CHARGE" ? "+" : "-"}
                      {money(entry.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DataTable
          heading="Ledger Orders"
          TableHeaders={ledgerOrderHeaders}
          TableData={customer.orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: new Date(order.createdAt).toLocaleDateString(),
            amount: money(order.totalAmount),
            due: money(order.dueAmount),
          }))}
          currentPage={1}
          totalPages={1}
          totalEntries={customer.orders.length}
          onPageChange={() => undefined}
        />
        <div className="flex justify-end border-t border-slate-100 pt-3">
          <Button variant="outline" icon={<X size={16} />} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
