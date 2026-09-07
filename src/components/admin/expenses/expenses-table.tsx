"use client";

import React from "react";
import { Edit2, Search, Trash2 } from "lucide-react";
import { ExpenseData } from "@/actions/expenses";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ExpensesTableProps {
  expenses: ExpenseData[];
  expenseTypes: string[];
  search: string;
  selectedExpenseType: string;
  selectedMonth: string;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onExpenseTypeChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (expense: ExpenseData) => void;
  onDelete: (expense: ExpenseData) => void;
}

function formatCurrency(value: number) {
  return `PKR ${value.toLocaleString()}`;
}

export function ExpensesTable({
  expenses,
  expenseTypes,
  search,
  selectedExpenseType,
  selectedMonth,
  currentPage,
  totalPages,
  totalEntries,
  isLoading,
  onSearchChange,
  onExpenseTypeChange,
  onMonthChange,
  onPageChange,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const tableHeaders: TableHeader[] = [
    { key: "titleFormatted", label: "Expense" },
    { key: "expenseTypeName", label: "Expense Type" },
    { key: "dateFormatted", label: "Expense Date" },
    { key: "paymentFormatted", label: "Payment Method" },
    { key: "amountFormatted", label: "Amount" },
  ];

  const formattedData = expenses.map((expense) => ({
    id: expense.id,
    titleFormatted: (
      <div>
        <p className="font-semibold text-slate-900">{expense.title}</p>
        {expense.notes && (
          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
            {expense.notes}
          </p>
        )}
      </div>
    ),
    expenseTypeName: expense.expenseType,
    dateFormatted: new Date(
      `${expense.expenseDate}T00:00:00`,
    ).toLocaleDateString("en-GB"),
    paymentFormatted: expense.paymentMethod.replace("_", " "),
    amountFormatted: (
      <span className="font-bold text-slate-900">
        {formatCurrency(expense.amount)}
      </span>
    ),
    rawExpense: expense,
  }));

  const headerActions = (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
      <div className="relative w-full sm:w-auto">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <Input
          aria-label="Search expenses"
          placeholder="Search expenses..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>
      <div className="w-full sm:w-auto">
        <Select
          aria-label="Filter by expense type"
          value={selectedExpenseType}
          onChange={(event) => onExpenseTypeChange(event.target.value)}
          options={[
            { label: "All Expense Types", value: "ALL" },
            ...expenseTypes.map((item) => ({ label: item, value: item })),
          ]}
        />
      </div>
      <div className="w-full sm:w-auto">
        <Input
          aria-label="Filter by month"
          type="month"
          value={selectedMonth === "ALL" ? "" : selectedMonth}
          onChange={(event) => onMonthChange(event.target.value || "ALL")}
        />
      </div>
    </div>
  );

  return (
    <DataTable
      heading="Expense Ledger"
      TableHeaders={tableHeaders}
      TableData={formattedData}
      currentPage={currentPage}
      totalPages={totalPages}
      totalEntries={totalEntries}
      isLoading={isLoading}
      onPageChange={onPageChange}
      headerActions={headerActions}
      TableButtons={[
        {
          icon: <Edit2 size={15} />,
          text: "Edit Expense",
          className:
            "bg-(--color-page-bg) text-(--color-primary) border border-(--color-secondary-bg)",
          onClick: (row) => onEdit(row.rawExpense),
        },
        {
          icon: <Trash2 size={15} />,
          text: "Delete Expense",
          className:
            "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
          onClick: (row) => onDelete(row.rawExpense),
        },
      ]}
    />
  );
}
