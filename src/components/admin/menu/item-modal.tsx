"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Plus, Trash2, Layers, Sliders, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  MenuItemData,
  CategoryData,
  AddOnData,
  MenuItemSize,
} from "@/actions/menu";
import { cn } from "@/lib/utils";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: MenuItemData | null;
  categories: CategoryData[];
  addOns: AddOnData[];
  onSave: (data: {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
    hasSizes: boolean;
    sizes: MenuItemSize[];
    addOnIds: string[];
  }) => Promise<void>;
  isPending: boolean;
}

export function ItemModal({
  isOpen,
  onClose,
  editingItem,
  categories,
  addOns,
  onSave,
  isPending,
}: ItemModalProps) {
  const [prevEditingItem, setPrevEditingItem] = useState<MenuItemData | null>(
    editingItem,
  );
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    basePrice: string;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
    hasSizes: boolean;
    sizes: MenuItemSize[];
    selectedAddOnIds: string[];
  }>({
    name: "",
    description: "",
    basePrice: "",
    categoryId: "",
    imageUrl: "",
    isAvailable: true,
    hasSizes: false,
    sizes: [],
    selectedAddOnIds: [],
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
              hasSizes: editingItem.hasSizes || false,
              sizes:
                editingItem.sizes && editingItem.sizes.length > 0
                  ? editingItem.sizes
                  : [
                      { name: "Small", price: editingItem.basePrice },
                      { name: "Large", price: editingItem.basePrice * 1.3 },
                    ],
              selectedAddOnIds: editingItem.addOns
                ? editingItem.addOns.map((a) => a.id)
                : [],
            }
          : {
              name: "",
              description: "",
              basePrice: "",
              categoryId: categories[0]?.id || "",
              imageUrl: "",
              isAvailable: true,
              hasSizes: false,
              sizes: [
                { name: "Small", price: 0 },
                { name: "Large", price: 0 },
              ],
              selectedAddOnIds: [],
            },
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

  // Size option handlers
  const handleAddSizeOption = () => {
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { name: "", price: 0 }],
    }));
  };

  const handleRemoveSizeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSizeChange = (
    index: number,
    field: "name" | "price",
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.sizes];
      if (field === "name") {
        updated[index] = { ...updated[index], name: value };
      } else {
        const numVal = parseFloat(value) || 0;
        updated[index] = { ...updated[index], price: numVal };
      }
      return { ...prev, sizes: updated };
    });
  };

  // AddOn toggle handler
  const handleToggleAddOn = (addOnId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedAddOnIds.includes(addOnId);
      const newIds = exists
        ? prev.selectedAddOnIds.filter((id) => id !== addOnId)
        : [...prev.selectedAddOnIds, addOnId];
      return { ...prev, selectedAddOnIds: newIds };
    });
  };

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

    let priceNum = parseFloat(formData.basePrice);

    if (formData.hasSizes) {
      if (formData.sizes.length === 0) {
        toast.error("Please add at least one size option or disable sizes.");
        return;
      }
      for (const s of formData.sizes) {
        if (!s.name.trim()) {
          toast.error("Size name cannot be empty.");
          return;
        }
        if (s.price < 0) {
          toast.error("Size price cannot be negative.");
          return;
        }
      }
      // If basePrice not provided, set basePrice to lowest size price
      if (isNaN(priceNum) || priceNum <= 0) {
        priceNum = formData.sizes[0].price;
      }
    } else {
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error("Please enter a valid base price.");
        return;
      }
    }

    await onSave({
      name: formData.name,
      description: formData.description,
      basePrice: priceNum,
      categoryId: formData.categoryId,
      imageUrl: formData.imageUrl,
      isAvailable: formData.isAvailable,
      hasSizes: formData.hasSizes,
      sizes: formData.hasSizes ? formData.sizes : [],
      addOnIds: formData.selectedAddOnIds,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Menu Food Item" : "Add New Menu Food Item"}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        {/* Basic Details */}
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
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, basePrice: e.target.value })
            }
            required={!formData.hasSizes}
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
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={2}
        />

        {/* Dynamic Sizes Section */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[var(--color-primary)]" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Item Sizing & Portions
                </h4>
                <p className="text-xs text-slate-500">
                  Enable if this item has multiple sizes (e.g. Small, Medium,
                  Large, Half, Full)
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.hasSizes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasSizes: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)] relative"></div>
              <span className="text-xs font-bold text-slate-700">
                {formData.hasSizes ? "Sizes Enabled" : "Single Size"}
              </span>
            </label>
          </div>

          {formData.hasSizes && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-600 px-1">
                <span className="col-span-6">
                  Size Name (e.g. Small / Large)
                </span>
                <span className="col-span-5">Price (PKR)</span>
                <span className="col-span-1 text-center">Action</span>
              </div>

              {formData.sizes.map((size, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <Input
                      placeholder="e.g. Small, Medium, 500ml"
                      value={size.name}
                      onChange={(e) =>
                        handleSizeChange(idx, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={size.price.toString()}
                      onChange={(e) =>
                        handleSizeChange(idx, "price", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSizeOption(idx)}
                      disabled={formData.sizes.length <= 1}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-30 transition-colors"
                      title="Remove Size"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddSizeOption}
                icon={<Plus size={16} />}
                className="mt-1 self-start text-xs py-1.5 px-3"
              >
                Add Size Option
              </Button>
            </div>
          )}
        </div>

        {/* Linked Add-Ons / Modifiers Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Add-Ons & Extra Modifiers
              </h4>
            </div>
          </div>

          {addOns.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No add-ons created yet. You can create add-ons in the
              &quot;Add-Ons & Modifiers&quot; tab.
            </p>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              {addOns.map((addon) => {
                const isSelected = formData.selectedAddOnIds.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() =>
                      addon.isAvailable && handleToggleAddOn(addon.id)
                    }
                    className={cn(
                      "flex items-center justify-between p-2.5  text-xs cursor-pointer transition-all",
                      !addon.isAvailable &&
                        "opacity-50 cursor-not-allowed bg-slate-50",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-white font-semibold"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-4 h-4 border flex items-center justify-center transition-colors ",
                          isSelected
                            ? "bg-white border-white text-emerald-500"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span
                      className={cn(
                        isSelected ? "text-white" : "text-slate-900",
                      )}
                    >
                      +Rs {addon.price.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
