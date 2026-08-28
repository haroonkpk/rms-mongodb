"use client";

import React, { useEffect, useState } from "react";

import { CategoryTabs } from "@/components/pos/category-tabs";
import { ItemGrid } from "@/components/pos/item-grid";
import { CustomizationModal } from "@/components/pos/customization-modal";
import { BillDrawer } from "@/components/pos/bill-drawer";
import { Loader2, Receipt } from "lucide-react";
import { Header } from "@/components/layouts";
import { CartItem, POSCategory, POSMenuItem } from "@/types";
import { getPOSInitData } from "@/actions/pos";

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [cashier, setCashier] = useState<{
    id?: string;
    fullName?: string | null;
    email: string;
    role?: string;
    shiftTiming?: string | null;
  } | null>(null);
  const [shiftStartTime, setShiftStartTime] = useState("08:00 AM");
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [menuItems, setMenuItems] = useState<POSMenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");

  // Bill Items State
  const [billItems, setBillItems] = useState<CartItem[]>([]);

  // Modal & Side Drawer States
  const [customizingItem, setCustomizingItem] = useState<POSMenuItem | null>(
    null,
  );
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isBillDrawerOpen, setIsBillDrawerOpen] = useState(false);

  // Calculate Bill Total
  const billTotalAmount = billItems.reduce(
    (acc, item) => acc + item.itemTotal,
    0,
  );
  const billItemCount = billItems.reduce((acc, item) => acc + item.quantity, 0);

  // Load real backend data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getPOSInitData();
        setCashier(data.cashier);
        setShiftStartTime(data.shiftStartTime);
        setCategories(data.categories);
        setMenuItems(data.menuItems);
      } catch (error) {
        console.error("Failed to load POS page data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
            JSON.stringify(newItem.addOns.map((a) => a.id).sort()),
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
          : item,
      ),
    );
  };

  // Remove single item from bill
  const handleRemoveBillItem = (cartItemId: string) => {
    setBillItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId),
    );
  };

  // Clear entire bill
  const handleClearBill = () => {
    setBillItems([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--color-page-bg) flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm font-semibold">Loading POS Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(0.75rem,2vw,1.5rem)] pb-24 relative">
      <Header title="POS / Order Entry" />

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
