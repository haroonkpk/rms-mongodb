"use client";

import React, { useEffect, useState, useTransition } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FolderPlus, Plus, Receipt, Tags } from "lucide-react";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  createExpense,
  ExpenseData,
  getExpenses,
  getExpenseTypes,
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
  ExpenseTypeData,
  updateExpense,
} from "@/actions/expenses";
import { ExpenseTypesTable } from "@/components/admin/expenses/expense-types-table";
import { ExpenseTypeModal } from "@/components/admin/expenses/expense-type-modal";
import { ExpensesTable } from "@/components/admin/expenses/expenses-table";
import { ExpenseForm } from "@/components/admin/expenses/expense-form";

export default function AdminExpensesPage() {
  const [activeTab, setActiveTab] = useState<"expenses" | "types">("expenses");
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [expenseTypeRecords, setExpenseTypeRecords] = useState<
    ExpenseTypeData[]
  >([]);
  const [isTypesLoading, setIsTypesLoading] = useState(true);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseTypeData | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [expenseType, setExpenseType] = useState("ALL");
  const [month, setMonth] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [formExpense, setFormExpense] = useState<
    ExpenseData | null | undefined
  >(undefined);

  const fetchExpenses = async () => {
    setIsLoading(true);
    const result = await getExpenses(page, 10, search, expenseType, month);
    if (result.success) {
      setExpenses(result.expenses);
      setExpenseTypes(result.expenseTypes);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } else {
      toast.error(result.error ?? "Unable to load expenses");
    }
    setIsLoading(false);
  };

  const fetchExpenseTypes = async () => {
    setIsTypesLoading(true);
    const result = await getExpenseTypes();
    if (result.success) setExpenseTypeRecords(result.expenseTypes);
    else toast.error(result.error ?? "Unable to load expense types");
    setIsTypesLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchExpenses());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, expenseType, month]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchExpenseTypes());
  }, []);

  const saveType = async (data: { name: string }) => {
    startTransition(async () => {
      const result = editingType
        ? await updateExpenseType(editingType.id, data)
        : await createExpenseType(data);
      if (!result.success) {
        toast.error(result.error ?? "Unable to save expense type");
        return;
      }
      toast.success(
        editingType ? "Expense type updated" : "Expense type created",
      );
      setIsTypeModalOpen(false);
      await fetchExpenseTypes();
      await fetchExpenses();
    });
  };

  const removeType = () => {
    if (!typeToDelete) return;
    startTransition(async () => {
      const result = await deleteExpenseType(typeToDelete.id);
      if (!result.success) {
        toast.error(result.error ?? "Unable to delete expense type");
        return;
      }
      toast.success("Expense type deleted");
      setTypeToDelete(null);
      await fetchExpenseTypes();
    });
  };

  const saveExpense = async (data: Parameters<typeof createExpense>[0]) => {
    startTransition(async () => {
      const result = formExpense
        ? await updateExpense(formExpense.id, data)
        : await createExpense(data);
      if (!result.success) {
        toast.error(result.error ?? "Unable to save expense");
        return;
      }
      toast.success(formExpense ? "Expense updated" : "Expense recorded");
      setFormExpense(undefined);
      await fetchExpenses();
    });
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />
      <Header title="Expense Management" />
      <main className="mt-4 flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)]">
        <div className="flex w-full items-center justify-end">
          <div className="flex w-fit flex-col justify-center gap-4 border border-slate-200 bg-white p-[clamp(1rem,2vw,1.5rem)] shadow-2xs md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                icon={<FolderPlus size={18} />}
                onClick={() => {
                  setEditingType(null);
                  setIsTypeModalOpen(true);
                }}
              >
                Add Expense Type
              </Button>
              <Button
                variant="primary"
                icon={<Plus size={18} />}
                onClick={() => setFormExpense(null)}
              >
                Record Expense
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-0.5 py-1 scrollbar-hide">
          {[
            {
              id: "expenses" as const,
              label: "Expense Ledger",
              icon: Receipt,
              count: total,
            },
            {
              id: "types" as const,
              label: "Expense Types",
              icon: Tags,
              count: expenseTypeRecords.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border px-[clamp(0.875rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vw,0.75rem)] text-xs font-semibold shadow-2xs transition-all sm:text-sm ${isActive ? "scale-[1.02] border-(--color-primary) bg-(--color-primary) text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "types" ? (
          <ExpenseTypesTable
            expenseTypes={expenseTypeRecords}
            isLoading={isTypesLoading}
            onEdit={(item) => {
              setEditingType(item);
              setIsTypeModalOpen(true);
            }}
            onDelete={(id, name) => setTypeToDelete({ id, name })}
          />
        ) : (
          <ExpensesTable
            expenses={expenses}
            expenseTypes={expenseTypes}
            search={search}
            selectedExpenseType={expenseType}
            selectedMonth={month}
            currentPage={page}
            totalPages={totalPages}
            totalEntries={total}
            isLoading={isLoading}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onExpenseTypeChange={(value) => {
              setExpenseType(value);
              setPage(1);
            }}
            onMonthChange={(value) => {
              setMonth(value);
              setPage(1);
            }}
            onPageChange={setPage}
            onEdit={setFormExpense}
          />
        )}
      </main>

      {formExpense !== undefined && (
        <ExpenseForm
          key={formExpense?.id ?? "new"}
          expense={formExpense}
          expenseTypes={expenseTypeRecords}
          onClose={() => setFormExpense(undefined)}
          onSave={saveExpense}
          isPending={isPending}
        />
      )}
      <ExpenseTypeModal
        key={`${isTypeModalOpen}-${editingType?.id ?? "new"}`}
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        editingType={editingType}
        onSave={saveType}
        isPending={isPending}
      />
      <ConfirmModal
        isOpen={Boolean(typeToDelete)}
        onClose={() => setTypeToDelete(null)}
        onConfirm={removeType}
        title="Delete expense type"
        message={`Delete "${typeToDelete?.name ?? ""}"? Expense types linked to expenses cannot be deleted.`}
        confirmText="Delete expense type"
        isLoading={isPending}
      />
    </div>
  );
}
