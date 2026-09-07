"use client";

import React, { useState } from "react";
import {
  ExpenseData,
  ExpenseTypeData,
  createExpense,
} from "@/actions/expenses";
import { ExpensePaymentMethod } from "../../../../prisma/generated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

const paymentLabels: Record<ExpensePaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card",
  OTHER: "Other",
};

type ExpenseFormErrors = Partial<{
  title: string;
  expenseType: string;
  amount: string;
  expenseDate: string;
  paymentMethod: string;
}>;

export function ExpenseForm({
  expense,
  onClose,
  onSave,
  isPending,
  expenseTypes,
}: {
  expense: ExpenseData | null;
  onClose: () => void;
  onSave: (data: Parameters<typeof createExpense>[0]) => Promise<void>;
  isPending: boolean;
  expenseTypes: ExpenseTypeData[];
}) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [expenseType, setExpenseType] = useState(
    expense?.expenseType ?? expenseTypes.at(-1)?.name ?? "",
  );
  const [amount, setAmount] = useState(expense?.amount.toString() ?? "");
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    expense?.paymentMethod ?? ExpensePaymentMethod.CASH,
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const nextErrors: ExpenseFormErrors = {};

    if (!title.trim()) nextErrors.title = "Expense title is required.";
    if (!expenseType.trim())
      nextErrors.expenseType = "Expense type is required.";
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = "Enter an amount greater than zero.";
    }
    if (!expenseDate) nextErrors.expenseDate = "Expense date is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      title: title.trim(),
      expenseType,
      amount: parsedAmount,
      expenseDate,
      paymentMethod,
      notes: notes.trim(),
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={expense ? "Edit expense" : "Record expense"}
      className="max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 pt-2" noValidate>
        <Input
          label="Expense title"
          placeholder="e.g. Gas bill"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Expense Type"
            value={expenseType}
            onChange={(event) => setExpenseType(event.target.value)}
            options={expenseTypes.map((item) => ({
              label: item.name,
              value: item.name,
            }))}
            error={errors.expenseType}
            required
          />
          <Input
            label="Amount (PKR)"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            error={errors.amount}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Expense date"
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            error={errors.expenseDate}
            required
          />
          <Select
            label="Payment method"
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as ExpensePaymentMethod)
            }
            options={Object.entries(paymentLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            error={errors.paymentMethod}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            className="text-xs font-bold uppercase tracking-wide text-slate-600"
            htmlFor="expense-notes"
          >
            Notes
          </label>
          <textarea
            id="expense-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional details"
            className="min-h-24 w-full resize-y border border-transparent bg-(--color-page-bg) p-3 text-sm text-slate-800 outline-none transition focus:border-(--color-primary) focus:bg-white"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : expense
                ? "Update expense"
                : "Save expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
