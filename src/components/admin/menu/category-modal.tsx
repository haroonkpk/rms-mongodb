"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { CategoryData } from "@/actions/menu";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: CategoryData | null;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  isPending: boolean;
}

export function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  onSave,
  isPending,
}: CategoryModalProps) {
  const [prevEditingCategory, setPrevEditingCategory] = useState<CategoryData | null>(editingCategory);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  if (editingCategory !== prevEditingCategory || isOpen !== prevIsOpen) {
    setPrevEditingCategory(editingCategory);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(
        editingCategory
          ? {
              name: editingCategory.name,
              description: editingCategory.description || "",
            }
          : {
              name: "",
              description: "",
            }
      );
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    await onSave({
      name: formData.name,
      description: formData.description,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? "Edit Category" : "Create New Category"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <Input
          label="Category Name"
          placeholder="e.g. Gourmet Burgers, Beverages, Desserts"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Brief description of this menu category..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
