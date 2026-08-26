"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ui/image-uploader";
import toast from "react-hot-toast";
import { MenuItemData, CategoryData } from "@/actions/menu";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: MenuItemData | null;
  categories: CategoryData[];
  onSave: (data: {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
  }) => Promise<void>;
  isPending: boolean;
}

export function ItemModal({
  isOpen,
  onClose,
  editingItem,
  categories,
  onSave,
  isPending,
}: ItemModalProps) {
  const [prevEditingItem, setPrevEditingItem] = useState<MenuItemData | null>(editingItem);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    categoryId: "",
    imageUrl: "",
    isAvailable: true,
  });

  if (editingItem !== prevEditingItem || isOpen !== prevIsOpen) {
    setPrevEditingItem(editingItem);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(
        editingItem
          ? {
              name: editingItem.name,
              description: editingItem.description || "",
              basePrice: editingItem.basePrice.toString(),
              categoryId: editingItem.categoryId,
              imageUrl: editingItem.imageUrl || "",
              isAvailable: editingItem.isAvailable,
            }
          : {
              name: "",
              description: "",
              basePrice: "",
              categoryId: categories[0]?.id || "",
              imageUrl: "",
              isAvailable: true,
            }
      );
    }
  }

  const categoryOptions: SelectOption[] = React.useMemo(() => {
    const opts = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
    return [{ value: "", label: "Select Category..." }, ...opts];
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a valid item name.");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Please select a category.");
      return;
    }
    const priceNum = parseFloat(formData.basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid base price.");
      return;
    }

    await onSave({
      name: formData.name,
      description: formData.description,
      basePrice: priceNum,
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl,
      isAvailable: formData.isAvailable,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Menu Food Item" : "Add New Menu Food Item"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Item Name"
            placeholder="e.g. Zinger Burger"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Category"
            options={categoryOptions}
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Input
            label="Base Price (PKR)"
            type="number"
            step="0.01"
            placeholder="e.g. 950"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            required
          />

          {/* Stock Availability Toggle Switch */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Stock Availability
            </span>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isAvailable: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              <span className="text-sm font-semibold text-slate-800">
                {formData.isAvailable ? "Available ON POS" : "Out of Stock"}
              </span>
            </label>
          </div>
        </div>

        <Textarea
          label="Description"
          placeholder="Describe ingredients, taste, or serving details..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        {/* Image Uploader */}
        <div className="border-t border-slate-100 pt-3">
          <ImageUploader
            label="Food Item Image"
            name="itemImageUrl"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {editingItem ? "Save Changes" : "Create Food Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
