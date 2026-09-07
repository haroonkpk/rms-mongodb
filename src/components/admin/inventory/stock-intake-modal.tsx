"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { InventoryItemData } from "@/actions/inventory";

interface StockIntakeItemRow {
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
}

interface StockIntakeRowErrors {
  inventoryItemId?: string;
  quantity?: string;
  unitCost?: string;
}

interface StockIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItemData[];
  onSave: (data: {
    notes?: string;
    items: Array<{
      inventoryItemId: string;
      quantity: number;
      unitCost: number;
    }>;
  }) => Promise<void>;
  isPending: boolean;
}

export const StockIntakeModal: React.FC<StockIntakeModalProps> = ({
  isOpen,
  onClose,
  inventoryItems,
  onSave,
  isPending,
}) => {
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<StockIntakeItemRow[]>([
    {
      inventoryItemId: "",
      quantity: "1",
      unitCost: "0",
    },
  ]);
  const [rowErrors, setRowErrors] = useState<StockIntakeRowErrors[]>([]);

  const handleClose = () => {
    setNotes("");
    setItems([
      {
        inventoryItemId: "",
        quantity: "1",
        unitCost: "0",
      },
    ]);
    setRowErrors([]);
    onClose();
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        inventoryItemId: "",
        quantity: "1",
        unitCost: "0",
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((i) => i.id === itemId);
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === index
          ? {
              ...row,
              inventoryItemId: itemId,
              unitCost: selectedItem ? selectedItem.unitCost.toString() : "0",
            }
          : row,
      ),
    );
    setRowErrors((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, inventoryItemId: undefined } : row,
      ),
    );
  };

  const handleRowChange = (
    index: number,
    field: "quantity" | "unitCost",
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, row) => {
      const q = parseFloat(row.quantity) || 0;
      const c = parseFloat(row.unitCost) || 0;
      return sum + q * c;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const validItems: Array<{
      inventoryItemId: string;
      quantity: number;
      unitCost: number;
    }> = [];

    const nextErrors: StockIntakeRowErrors[] = items.map(() => ({}));
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.inventoryItemId) {
        nextErrors[i].inventoryItemId = "Select an inventory item.";
      }
      const q = parseFloat(row.quantity);
      const c = parseFloat(row.unitCost);
      if (isNaN(q) || q <= 0) {
        nextErrors[i].quantity = "Enter a valid quantity greater than zero.";
      }
      if (isNaN(c) || c < 0) {
        nextErrors[i].unitCost = "Enter a valid unit cost.";
      }
      if (
        nextErrors[i].inventoryItemId ||
        nextErrors[i].quantity ||
        nextErrors[i].unitCost
      ) {
        continue;
      }
      validItems.push({
        inventoryItemId: row.inventoryItemId,
        quantity: q,
        unitCost: c,
      });
    }

    setRowErrors(nextErrors);
    if (nextErrors.some((row) => Object.keys(row).length > 0)) return;
    await onSave({
      notes: notes.trim() || undefined,
      items: validItems,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Stock Intake / Restock Entry"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Intake Notes (Optional)
          </label>
          <Input
            placeholder="e.g. Purchased from Local Market"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        {/* Restock Items List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              Items & Quantities
            </h4>
            <Button
              type="button"
              variant="outline"
              icon={<Plus size={14} />}
              onClick={handleAddItemRow}
            >
              Add Item Row
            </Button>
          </div>

          <div className="flex flex-col-reverse gap-2 max-h-60 overflow-y-auto pr-1">
            {items.map((row, index) => {
              const selectedItem = inventoryItems.find(
                (i) => i.id === row.inventoryItemId,
              );
              const rowTotal =
                (parseFloat(row.quantity) || 0) *
                (parseFloat(row.unitCost) || 0);

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 "
                >
                  <div className="flex-1 w-full">
                    <Select
                      value={row.inventoryItemId}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      options={[
                        { label: "Select item...", value: "" },
                        ...inventoryItems.map((i) => ({
                          label: `${i.name} (${i.unit})`,
                          value: i.id,
                        })),
                      ]}
                      error={rowErrors[index]?.inventoryItemId}
                    />
                  </div>

                  <div className="w-full sm:w-28 flex items-center gap-1">
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) =>
                        handleRowChange(index, "quantity", e.target.value)
                      }
                      error={rowErrors[index]?.quantity}
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      {selectedItem?.unit || ""}
                    </span>
                  </div>

                  <div className="w-full sm:w-32">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Cost (PKR)"
                      value={row.unitCost}
                      onChange={(e) =>
                        handleRowChange(index, "unitCost", e.target.value)
                      }
                      error={rowErrors[index]?.unitCost}
                    />
                  </div>

                  <div className="w-full sm:w-32 text-right font-bold text-xs text-slate-900 shrink-0">
                    PKR {rowTotal.toLocaleString()}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 "
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        ,{/* Bill Summary */}
        <div className="p-3 bg-emerald-50 border border-emerald-200  flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
            Total Intake Amount:
          </span>
          <span className="text-lg font-black text-emerald-700">
            PKR {calculateTotal().toLocaleString()}
          </span>
        </div>
        <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Adding Stock..." : "Confirm & Update Stock"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
