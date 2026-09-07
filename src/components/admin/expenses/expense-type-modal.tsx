"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExpenseTypeData } from "@/actions/expenses";

export function ExpenseTypeModal({
  isOpen,
  onClose,
  editingType,
  onSave,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingType: ExpenseTypeData | null;
  onSave: (data: { name: string }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(editingType?.name ?? "");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Expense type name is required.");
      return;
    }
    setError("");
    await onSave({ name });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingType ? "Edit Expense Type" : "Add Expense Type"}
      className="max-w-md"
    >
      <form onSubmit={submit} className="mt-2 flex flex-col gap-4">
        {error && (
          <p className="border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
        <Input
          label="Expense Type"
          placeholder="e.g. Utilities"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : editingType
                ? "Update Expense Type"
                : "Save Expense Type"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
