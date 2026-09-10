"use client";

import React, { useMemo, useState } from "react";
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
  const [prevEditingAddOn, setPrevEditingAddOn] = useState<AddOnData | null>(
    editingAddOn,
  );
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    isAvailable: true,
  });

  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);

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
            },
      );
      setRecipeIngredients(editingAddOn?.ingredients || []);
    }
  }

  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) {
      toast.error("No inventory raw items available.");
      return;
    }
    setRecipeIngredients([
      ...recipeIngredients,
      { inventoryItemId: inventoryItems[0].id, quantityRequired: 1 },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: "inventoryItemId" | "quantityRequired",
    value: string,
  ) => {
    setRecipeIngredients((current) => {
      const updated = [...current];
      if (field === "inventoryItemId") {
        updated[index] = { ...updated[index], inventoryItemId: value };
      } else {
        updated[index] = {
          ...updated[index],
          quantityRequired: parseFloat(value) || 0,
        };
      }
      return updated;
    });
  };

  const actualCost = useMemo(
    () =>
      recipeIngredients.reduce((total, ingredient) => {
        const inventoryItem = inventoryItems.find(
          (item) => item.id === ingredient.inventoryItemId,
        );
        return (
          total + (inventoryItem?.unitCost ?? 0) * ingredient.quantityRequired
        );
      }, 0),
    [inventoryItems, recipeIngredients],
  );

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingAddOn ? "Edit Add-On / Modifier" : "Create New Add-On / Modifier"
      }
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

        {/* Recipe Ingredients Mapping */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils size={16} className="text-emerald-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Raw Materials
              </h4>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddIngredientRow}
              icon={<Plus size={14} />}
            >
              Add
            </Button>
          </div>

          {recipeIngredients.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No recipe ingredients added yet. Click &quot;Add&quot; to link raw
              materials to this add-on.
            </p>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-emerald-200/60">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-600 px-1">
                <span className="col-span-7">Raw Material Item</span>
                <span className="col-span-4">Qty per Add-On</span>
                <span className="col-span-1 text-center">Action</span>
              </div>
              {recipeIngredients.map((ingredient, index) => {
                const selectedInventoryItem = inventoryItems.find(
                  (item) => item.id === ingredient.inventoryItemId,
                );
                return (
                  <div
                    key={`${ingredient.inventoryItemId}-${index}`}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-7">
                      <Select
                        options={inventoryItems.map((item) => ({
                          value: item.id,
                          label: `${item.name} (${item.unit})`,
                        }))}
                        value={ingredient.inventoryItemId}
                        onChange={(event) =>
                          handleIngredientChange(
                            index,
                            "inventoryItemId",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-4 flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Qty"
                        value={ingredient.quantityRequired.toString()}
                        onChange={(event) =>
                          handleIngredientChange(
                            index,
                            "quantityRequired",
                            event.target.value,
                          )
                        }
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">
                        {selectedInventoryItem?.unit || ""}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(index)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Remove Ingredient"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-emerald-200 pt-3">
            <span className="text-sm font-bold text-slate-700">
              Actual Cost per Add-On
            </span>
            <span className="text-lg font-bold text-emerald-700">
              Rs{" "}
              {actualCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
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
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
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
