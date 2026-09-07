"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InventoryItemData } from "@/actions/inventory";
import { StockMovementType } from "../../../../prisma/generated";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemData | null;
  onSave: (data: {
    inventoryItemId: string;
    quantityChange: number;
    type: StockMovementType;
    reason?: string;
  }) => Promise<void>;
  isPending: boolean;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  isPending,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<StockMovementType>(
    StockMovementType.MANUAL_ADJUSTMENT
  );
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState<"ADD" | "SUBTRACT">("SUBTRACT");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType(StockMovementType.WASTAGE_OUT);
      setDirection("SUBTRACT");
      setQuantity("1");
      setReason("");
      setError("");
    }
  }, [isOpen]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = parseFloat(quantity);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }

    const finalChange = direction === "ADD" ? qtyVal : -qtyVal;

    setError("");
    await onSave({
      inventoryItemId: item.id,
      quantityChange: finalChange,
      type: adjustmentType,
      reason: reason.trim() || undefined,
    });
  };

  const currentQty = item.quantity;
  const qtyVal = parseFloat(quantity) || 0;
  const changeVal = direction === "ADD" ? qtyVal : -qtyVal;
  const projectQty = Math.max(0, currentQty + changeVal);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${item.name}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* Info Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200  flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Current Stock</p>
            <p className="text-lg font-bold text-slate-900">
              {currentQty.toLocaleString()} {item.unit}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Projected Stock</p>
            <p className="text-lg font-bold text-(--color-primary)">
              {projectQty.toLocaleString()} {item.unit}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 ">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Adjustment Type *
            </label>
            <Select
              value={adjustmentType}
              onChange={(e) => {
                const val = e.target.value as StockMovementType;
                setAdjustmentType(val);
                if (val === StockMovementType.PURCHASE_IN) {
                  setDirection("ADD");
                } else {
                  setDirection("SUBTRACT");
                }
              }}
              options={[
                { label: "Wastage (-)", value: StockMovementType.WASTAGE_OUT },
                { label: "Damaged (-)", value: StockMovementType.SPOILAGE_OUT },
                { label: "Stock Intake(+)", value: StockMovementType.PURCHASE_IN },
                { label: "Manual Correction", value: StockMovementType.MANUAL_ADJUSTMENT },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Action *
            </label>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "ADD" | "SUBTRACT")}
              options={[
                { label: "Deduct from stock (-)", value: "SUBTRACT" },
                { label: "Add to stock (+)", value: "ADD" },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Quantity ({item.unit}) *
          </label>
          <Input
            type="number"
            step="any"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Notes
          </label>
          <Textarea
            placeholder="Reason for adjustment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Applying..." : "Apply Adjustment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
