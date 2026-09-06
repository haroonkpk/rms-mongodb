"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InventoryCategoryData } from "@/actions/inventory";

interface InventoryCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: InventoryCategoryData | null;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
  isPending: boolean;
}

export const InventoryCategoryModal: React.FC<InventoryCategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  onSave,
  isPending,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError("");
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setError("");
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? "Edit Category" : "Add Inventory Category"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Category Name *
          </label>
          <Input
            placeholder="e.g. Dairy, Meat, Spices, Packaging"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Description (Optional)
          </label>
          <Textarea
            placeholder="Category details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : editingCategory
              ? "Update Category"
              : "Save Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
