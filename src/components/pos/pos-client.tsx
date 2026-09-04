"use client";

import React, { useState, useTransition } from "react";
import { CategoryTabs } from "@/components/pos/category-tabs";
import { ItemGrid } from "@/components/pos/item-grid";
import { CustomizationModal } from "@/components/pos/customization-modal";
import { BillDrawer } from "@/components/pos/bill-drawer";
import { Receipt, RefreshCw } from "lucide-react";
import { Header } from "@/components/layouts";
import { CartItem, POSCategory, POSMenuItem, POSInitDataResponse } from "@/types";
import { getPOSInitData } from "@/actions/pos";

interface POSClientProps {
  initialData: POSInitDataResponse;
}

export function POSClient({ initialData }: POSClientProps) {
  const [cashier, setCashier] = useState(initialData.cashier);
  const [categories, setCategories] = useState<POSCategory[]>(
    initialData.categories || []
  );
  const [menuItems, setMenuItems] = useState<POSMenuItem[]>(
    initialData.menuItems || []
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");

  // Bill Items State
  const [billItems, setBillItems] = useState<CartItem[]>([]);

  // Modal & Side Drawer States
  const [customizingItem, setCustomizingItem] = useState<POSMenuItem | null>(
    null
  );
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isBillDrawerOpen, setIsBillDrawerOpen] = useState(false);

  // Background refresh state transition
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const data = await getPOSInitData();
        if (data.success) {
          setCashier(data.cashier);
          setCategories(data.categories);
          setMenuItems(data.menuItems);
        }
      } catch (err) {
        console.error("Failed to sync POS data:", err);
      }
    });
  };

  // Calculate Bill Total
  const billTotalAmount = billItems.reduce(
    (acc, item) => acc + item.itemTotal,
    0
  );
  const billItemCount = billItems.reduce((acc, item) => acc + item.quantity, 0);

  // Selecting item from grid ALWAYS opens customization modal
  const handleSelectItem = (item: POSMenuItem) => {
    setCustomizingItem(item);
    setIsCustomizationOpen(true);
  };

  // Add customized item to bill
  const handleAddToBill = (newItem: CartItem) => {
    setBillItems((prevBill) => {
      const existingIndex = prevBill.findIndex(
        (ci) =>
          ci.itemId === newItem.itemId &&
          ci.variant?.name === newItem.variant?.name &&
          ci.notes === newItem.notes &&
          JSON.stringify(ci.addOns.map((a) => a.id).sort()) ===
            JSON.stringify(newItem.addOns.map((a) => a.id).sort())
      );

      if (existingIndex > -1) {
        const updated = [...prevBill];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          itemTotal: existing.unitPrice * newQty,
        };
        return updated;
      } else {
        return [...prevBill, newItem];
      }
    });
  };

  // Update item quantity in bill
  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveBillItem(cartItemId);
      return;
    }

    setBillItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity: newQuantity,
              itemTotal: item.unitPrice * newQuantity,
            }
          : item
      )
    );
  };

  // Remove single item from bill
  const handleRemoveBillItem = (cartItemId: string) => {
    setBillItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  // Clear entire bill
  const handleClearBill = () => {
    setBillItems([]);
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(0.75rem,2vw,1.5rem)] pb-24 relative">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Header title="POS / Order Entry" />
        <button
          onClick={handleRefresh}
          disabled={isPending}
          title="Refresh Menu & POS Data"
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
        >
          <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
          <span>{isPending ? "Syncing..." : "Sync Menu"}</span>
        </button>
      </div>

      {/* Category Tabs & Food Item Grid */}
      <div className="w-full">
        <CategoryTabs
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          totalAllItemsCount={menuItems.length}
        />

        <ItemGrid
          items={menuItems}
          selectedCategoryId={selectedCategoryId}
          onSelectItem={handleSelectItem}
        />
      </div>

      {/* Floating Action Button for Active Bill (Bottom Right) */}
      {billItemCount > 0 && !isBillDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsBillDrawerOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 bg-[var(--color-primary)] text-white rounded-full font-bold shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-white/30"
          >
            <div className="relative">
              <Receipt size={22} />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[0.65rem] font-black flex items-center justify-center">
                {billItemCount}
              </span>
            </div>
            <div className="text-left leading-tight">
              <span className="text-[0.65rem] opacity-80 uppercase block tracking-wider font-semibold">
                Open Bill
              </span>

              <span className="text-bold font-black">
                Rs. {billTotalAmount.toLocaleString()}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Customization Modal (Opens on Item Card Selection) */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        item={customizingItem}
        onAddToBill={handleAddToBill}
      />

      {/* Hidden Side Bill Drawer (Slide Out) */}
      <BillDrawer
        isOpen={isBillDrawerOpen}
        onClose={() => setIsBillDrawerOpen(false)}
        billItems={billItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveBillItem}
        onClearBill={handleClearBill}
        cashierName={cashier?.fullName || cashier?.email?.split("@")[0]}
      />
    </div>
  );
}
