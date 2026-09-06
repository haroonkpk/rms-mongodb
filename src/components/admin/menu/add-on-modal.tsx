"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, Trash2, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import { AddOnData, RecipeIngredient } from "@/actions/menu";
import { InventoryItemData } from "@/actions/inventory";

interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAddOn: AddOnData | null;
  inventoryItems?: InventoryItemData[];
  onSave: (data: {
    name: string;
    price: number;
    isAvailable: boolean;
    ingredients?: RecipeIngredient[];
  }) => Promise<void>;
  isPending: boolean;
}

export function AddOnModal({
  isOpen,
  onClose,
  editingAddOn,
  inventoryItems = [],
  onSave,
  isPending,
}: AddOnModalProps) {
  const [prevEditingAddOn, setPrevEditingAddOn] = useState<AddOnData | null>(editingAddOn);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    isAvailable: true,
  });

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>("");
  const [requiredQtyInput, setRequiredQtyInput] = useState<string>("");

  if (editingAddOn !== prevEditingAddOn || isOpen !== prevIsOpen) {
    setPrevEditingAddOn(editingAddOn);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData(
        editingAddOn
          ? {
              name: editingAddOn.name,
              price: editingAddOn.price.toString(),
              isAvailable: editingAddOn.isAvailable,
            }
          : {
              name: "",
              price: "",
              isAvailable: true,
            }
      );
      setRecipeIngredients(editingAddOn?.ingredients || []);
      setSelectedInvId("");
      setRequiredQtyInput("");
    }
  }

  const handleAddIngredientRow = () => {
    if (!selectedInvId) {
      toast.error("Please select a raw material ingredient.");
      return;
    }
    const qty = parseFloat(requiredQtyInput);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity required.");
      return;
    }

    if (recipeIngredients.some((ing) => ing.inventoryItemId === selectedInvId)) {
      toast.error("This raw material is already in the add-on recipe.");
      return;
    }

    setRecipeIngredients([
      ...recipeIngredients,
      { inventoryItemId: selectedInvId, quantityRequired: qty },
    ]);
    setSelectedInvId("");
    setRequiredQtyInput("");
  };

  const handleRemoveIngredientRow = (invId: string) => {
    setRecipeIngredients(recipeIngredients.filter((ing) => ing.inventoryItemId !== invId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Add-on option name is required.");
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid extra price.");
      return;
    }

    await onSave({
      name: formData.name,
      price: priceNum,
      isAvailable: formData.isAvailable,
      ingredients: recipeIngredients,
    });
  };

  const inventoryOptions = [
    { label: "-- Select Raw Material --", value: "" },
    ...inventoryItems.map((inv) => ({
      label: `${inv.name} (${inv.unit})`,
      value: inv.id,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAddOn ? "Edit Add-On / Modifier" : "Create New Add-On / Modifier"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <Input
          label="Add-On Option Name"
          placeholder="e.g. Extra Cheese Slice, Mayo Dip, Beef Patty"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Extra Price (PKR)"
          type="number"
          step="0.01"
          placeholder="e.g. 120"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />

        {/* Recipe Ingredients for AddOn */}
        <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Utensils size={16} className="text-emerald-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Add-On Recipe Raw Materials (Stock Decrement)
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <Select
                value={selectedInvId}
                onChange={(e) => setSelectedInvId(e.target.value)}
                options={inventoryOptions}
              />
            </div>
            <div className="w-28">
              <Input
                type="number"
                step="0.001"
                placeholder="Qty Req."
                value={requiredQtyInput}
                onChange={(e) => setRequiredQtyInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              icon={<Plus size={16} />}
              onClick={handleAddIngredientRow}
            >
              Add
            </Button>
          </div>

          {recipeIngredients.length > 0 ? (
            <div className="flex flex-col gap-1.5 mt-2">
              {recipeIngredients.map((ing) => {
                const invItem = inventoryItems.find(
                  (item) => item.id === ing.inventoryItemId
                );
                return (
                  <div
                    key={ing.inventoryItemId}
                    className="flex justify-between items-center bg-white px-3 py-1.5 border border-slate-200 text-xs rounded-md"
                  >
                    <span className="font-semibold text-slate-800">
                      {invItem?.name || "Raw Material"} ({invItem?.unit || "unit"})
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-800">
                        {ing.quantityRequired} {invItem?.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(ing.inventoryItemId)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic mt-1">
              No raw materials mapped to this add-on yet.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Option Availability
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
              {formData.isAvailable ? "Available ON POS" : "Disabled"}
            </span>
          </label>
        </div>

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
            {editingAddOn ? "Update Modifier" : "Create Modifier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
