"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InventoryItemData, InventoryCategoryData } from "@/actions/inventory";
import { InventoryUnit } from "../../../../prisma/generated";

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: InventoryItemData | null;
  categories: InventoryCategoryData[];
  onSave: (data: {
    name: string;
    sku?: string;
    categoryId: string;
    unit: InventoryUnit;
    quantity?: number;
    minStockLevel?: number;
    unitCost?: number;
  }) => Promise<void>;
  isPending: boolean;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  categories,
  onSave,
  isPending,
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>(InventoryUnit.KG);
  const [quantity, setQuantity] = useState("0");
  const [minStockLevel, setMinStockLevel] = useState("10");
  const [unitCost, setUnitCost] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSku(editingItem.sku || "");
      setCategoryId(editingItem.categoryId);
      setUnit(editingItem.unit);
      setQuantity(editingItem.quantity.toString());
      setMinStockLevel(editingItem.minStockLevel.toString());
      setUnitCost(editingItem.unitCost.toString());
    } else {
      setName("");
      setSku("");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setUnit(InventoryUnit.KG);
      setQuantity("0");
      setMinStockLevel("10");
      setUnitCost("0");
    }
    setError("");
  }, [editingItem, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setError("");
    await onSave({
      name: name.trim(),
      sku: sku.trim() || undefined,
      categoryId,
      unit,
      quantity: parseFloat(quantity) || 0,
      minStockLevel: parseFloat(minStockLevel) || 0,
      unitCost: parseFloat(unitCost) || 0,
    });
  };

  const unitOptions = [
    { label: "Kilograms (kg)", value: InventoryUnit.KG },
    { label: "Grams (g)", value: InventoryUnit.GRAM },
    { label: "Liters (L)", value: InventoryUnit.LITER },
    { label: "Milliliters (ml)", value: InventoryUnit.ML },
    { label: "Pieces (pcs)", value: InventoryUnit.PIECE },
    { label: "Packs", value: InventoryUnit.PACK },
    { label: "Boxes", value: InventoryUnit.BOX },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Item Name *
            </label>
            <Input
              placeholder="e.g. Mozzarella Cheese, Flour"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              SKU Code (Optional)
            </label>
            <Input
              placeholder="e.g. RAW-CHS-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Category *
            </label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { label: "-- Select Category --", value: "" },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Measurement Unit *
            </label>
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value as InventoryUnit)}
              options={unitOptions}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!editingItem && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Initial Stock Qty
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Min Reorder Level *
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Unit Cost (PKR) *
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : editingItem ? "Update Item" : "Save Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
