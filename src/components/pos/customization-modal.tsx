"use client";

import React, { useState, useEffect } from "react";
import { POSMenuItem, CartAddOnItem, CartItem, POSItemSize } from "@/types/pos";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Check, Receipt, Utensils } from "lucide-react";
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
  const [selectedSize, setSelectedSize] = useState<POSItemSize | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<CartAddOnItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      const defaultSize =
        item.hasSizes && item.sizes && item.sizes.length > 0
          ? item.sizes[0]
          : null;
      setSelectedSize(defaultSize);
      setSelectedAddOns([]);
      setQuantity(1);
      setNotes("");
    }
  }, [item, isOpen]);

  if (!item) return null;

  const itemBasePrice = selectedSize ? selectedSize.price : item.basePrice;
  const addOnsTotal = selectedAddOns.reduce((acc, curr) => acc + curr.price, 0);
  const unitPrice = itemBasePrice + addOnsTotal;
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
    const cartItemId = `${item.id}-${selectedSize?.name || "std"}-${selectedAddOns
      .map((a) => a.id)
      .sort()
      .join("-")}-${Date.now()}`;

    const newCartItem: CartItem = {
      cartItemId,
      itemId: item.id,
      name: item.name,
      basePrice: itemBasePrice,
      variant: selectedSize
        ? {
            name: selectedSize.name,
            priceOffset: selectedSize.price - item.basePrice,
          }
        : undefined,
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
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-[clamp(1rem,1.5vw,1.25rem)] pt-2 pb-4">
        {/* Item Banner */}
        <div className="flex gap-4 p-3 bg-slate-50 border border-slate-200">
          <div className="w-16 h-16 bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
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
            {item.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Section 1: Item Sizes */}
        {item.hasSizes && item.sizes && item.sizes.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Size Option
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {item.sizes.map((size) => {
                const isSelected = selectedSize?.name === size.name;
                return (
                  <button
                    key={size.name}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "p-2.5 border text-left text-xs transition-all cursor-pointer flex flex-col justify-between",
                      isSelected
                        ? "bg-emerald-500 font-bold text-white "
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white",
                    )}
                  >
                    <span>{size.name}</span>
                    <span
                      className={cn(
                        "mt-1 text-[0.75rem] font-extrabold",
                        isSelected ? "text-white" : "text-slate-900",
                      )}
                    >
                      Rs {size.price.toLocaleString()}
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
                      "flex items-center justify-between p-2.5  text-xs cursor-pointer transition-all",
                      !addon.isAvailable &&
                        "opacity-50 cursor-not-allowed bg-slate-50",
                      isChecked
                        ? "border-emerald-500 bg-emerald-500 text-white font-semibold"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-4 h-4 border flex items-center justify-center transition-colors ",
                          isChecked
                            ? "bg-white border-white text-emerald-500"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {isChecked && <Check size={12} />}
                      </div>
                      <span>{addon.name}</span>
                    </div>
                    <span
                      className={cn(
                        isChecked ? "text-white" : "text-slate-900",
                      )}
                    >
                      +Rs {addon.price.toLocaleString()}
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
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 disabled:opacity-40 transition-colors shadow-2xs rounded-md"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold text-slate-900 min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-2xs rounded-md"
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
            <span className="text-lg font-extrabold text-emerald-600">
              Rs {itemTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
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
