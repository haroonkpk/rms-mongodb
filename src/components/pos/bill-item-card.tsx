"use client";

import React from "react";
import { CartItem } from "@/types/pos";
import { Minus, Plus, Trash2 } from "lucide-react";

interface BillItemCardProps {
  item: CartItem;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem?: (cartItemId: string) => void;
}

export function BillItemCard({
  item,
  onUpdateQuantity,
  onRemoveItem,
}: BillItemCardProps) {
  return (
    <div className="p-3.5 bg-white border border-slate-200 shadow-xs space-y-2.5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Item Title */}
          <div
            className="inline-flex items-center px-3.5 pr-7 py-1.5 bg-(--color-primary)/90 max-w-full"
            style={{
              clipPath: "polygon(0 0, 100% 0, 90% 100%, 0 100%)",
            }}
          >
            <h4 className="text-[clamp(0.875rem,1.2vw,1rem)] font-bold text-white truncate">
              {item.name}
            </h4>
          </div>

          {/* Size / Variant Badge */}
          {item.variant && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider">
                Size:
              </span>
              <span className="inline-flex items-center px-2 py-0.5 text-[0.7rem] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/25">
                {item.variant.name}
              </span>
            </div>
          )}

          {/* Bulleted Add-ons List */}
          {item.addOns.length > 0 && (
            <div className="pt-1 space-y-1">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block">
                Add-ons:
              </span>
              <ul className="space-y-1 pl-1 text-[0.7rem] text-slate-600">
                {item.addOns.map((addon) => (
                  <li
                    key={addon.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                      <span className="truncate font-medium">
                        {addon.name}
                      </span>
                    </div>
                    {addon.price > 0 && (
                      <span className="text-[0.65rem] font-semibold text-emerald-600 shrink-0">
                        +Rs. {addon.price.toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="mt-1 flex items-start gap-1 text-[0.68rem] bg-amber-50/80 px-2 py-1 text-amber-800 border border-amber-200/50">
              <span className="font-semibold">Note:</span> {item.notes}
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-slate-900 block">
            Rs. {item.itemTotal.toLocaleString()}
          </span>
          <span className="text-[0.65rem] font-medium text-slate-400 block mt-0.5">
            Rs. {item.unitPrice.toLocaleString()} ea
          </span>
        </div>
      </div>

      {/* Quantity Controls & Delete */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-50 p-0.5 rounded-md border border-slate-200/70">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
            className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            title="Decrease quantity"
          >
            <Minus size={12} />
          </button>
          <span className="text-xs font-bold text-slate-900 min-w-[1.5rem] text-center">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
            className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            title="Increase quantity"
          >
            <Plus size={12} />
          </button>
        </div>

        {onRemoveItem && (
          <button
            type="button"
            onClick={() => onRemoveItem(item.cartItemId)}
            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Remove item"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
