"use client";

import React, { useState, useEffect } from "react";
import { POSMenuItem, CartAddOnItem, CartItem, POSVariant } from "@/types/pos";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Check,
  MessageSquare,
  Receipt,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: POSMenuItem | null;
  onAddToBill: (cartItem: CartItem) => void;
}

export function CustomizationModal({
  isOpen,
  onClose,
  item,
  onAddToBill,
}: CustomizationModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<POSVariant | null>(
    null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<CartAddOnItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      const defaultVariant =
        item.variants && item.variants.length > 0 ? item.variants[0] : null;
      setSelectedVariant(defaultVariant);
      setSelectedAddOns([]);
      setQuantity(1);
      setNotes("");
    }
  }, [item, isOpen]);

  if (!item) return null;

  const variantOffset = selectedVariant ? selectedVariant.priceOffset : 0;
  const addOnsTotal = selectedAddOns.reduce((acc, curr) => acc + curr.price, 0);
  const unitPrice = item.basePrice + variantOffset + addOnsTotal;
  const itemTotal = unitPrice * quantity;

  const toggleAddOn = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [
          ...prev,
          { id: addon.id, name: addon.name, price: addon.price },
        ];
      }
    });
  };

  const handleConfirmAddToBill = () => {
    const cartItemId = `${item.id}-${selectedVariant?.name || "std"}-${selectedAddOns
      .map((a) => a.id)
      .sort()
      .join("-")}-${Date.now()}`;

    const newCartItem: CartItem = {
      cartItemId,
      itemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      variant: selectedVariant || undefined,
      addOns: selectedAddOns,
      quantity,
      unitPrice,
      itemTotal,
      notes: notes.trim() || undefined,
      imageUrl: item.imageUrl,
    };

    onAddToBill(newCartItem);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Item for Bill"
      className="max-w-xl"
    >
      <div className="space-y-[clamp(1rem,1.5vw,1.25rem)] pt-2 pb-4">
        {/* Item Banner */}
        <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200">
          <div className="w-16 h-16  bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Utensils size={24} />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {item.name}
            </h3>
          </div>
        </div>

        {/* Section 1: Variants / Size */}
        {item.variants && item.variants.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Size / Variant
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.variants.map((v) => {
                const isSelected = selectedVariant?.name === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "p-2.5  border text-left text-xs transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "border-green-400/30 bg-green-100/70 font-bold text-green-800 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white",
                    )}
                  >
                    <span>{v.name}</span>
                    <span className="text-[0.7rem] opacity-80 mt-1">
                      {v.priceOffset > 0
                        ? `+ Rs${v.priceOffset.toFixed(2)}`
                        : "Standard"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Add-Ons */}
        {item.addOns && item.addOns.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Add-Ons & Extras
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {item.addOns.map((addon) => {
                const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => addon.isAvailable && toggleAddOn(addon)}
                    className={cn(
                      "flex items-center justify-between p-2.5 border-2 text-xs cursor-pointer transition-all",
                      !addon.isAvailable &&
                        "opacity-50 cursor-not-allowed bg-slate-50",
                      isChecked
                        ? "border-green-400/20 bg-green-100/50 text-slate-900 font-semibold"
                        : "border-slate-200 hover:border-slate-300 bg-slate-100/50 text-slate-700",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-4 h-4 border flex items-center justify-center transition-colors",
                          isChecked
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {isChecked && <Check size={12} />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      +Rs.{addon.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Quantity */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Quantity
          </label>
          <div className="flex items-center gap-3 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 rounded-[clamp(0.375rem,0.5vw,0.5rem)] bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold text-slate-900 min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-[clamp(0.375rem,0.5vw,0.5rem)] bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-2xs"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Section 4: Kitchen Notes */}
        <div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Extra crispy, sauce on side..."
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">
              Total
            </span>
            <span className="text-lg font-bold text-green-600">
              {itemTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs py-2 px-4"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAddToBill}
              icon={<Receipt className="w-4 h-4" />}
            >
              Add to Bill
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
