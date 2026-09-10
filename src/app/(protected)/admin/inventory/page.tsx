"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Boxes, Plus, Layers, FolderPlus, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getStockIntakeBatches,
  createStockIntakeBatch,
  getInventoryCategories,
  createInventoryCategory,
  updateInventoryCategory,
  deleteInventoryCategory,
  InventoryItemData,
  StockIntakeBatchData,
  InventoryCategoryData,
} from "@/actions/inventory";
import {
  StockMovementType,
  InventoryUnit,
} from "../../../../../prisma/generated";

import { InventoryItemsTable } from "@/components/admin/inventory/inventory-items-table";
import { InventoryItemModal } from "@/components/admin/inventory/inventory-item-modal";
import { StockAdjustmentModal } from "@/components/admin/inventory/stock-adjustment-modal";
import { StockIntakeTable } from "@/components/admin/inventory/stock-intake-table";
import { StockIntakeModal } from "@/components/admin/inventory/stock-intake-modal";
import { InventoryCategoriesTable } from "@/components/admin/inventory/inventory-categories-table";
import { InventoryCategoryModal } from "@/components/admin/inventory/inventory-category-modal";

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<
    "items" | "intakes" | "movements" | "categories"
  >("items");
  const [isPending, startTransition] = useTransition();

  // Data States
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [allAllItems, setAllItems] = useState<InventoryItemData[]>([]);
  const [batches, setBatches] = useState<StockIntakeBatchData[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryData[]>([]);

  // Loading States
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [isBatchesLoading, setIsBatchesLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Filters & Pagination for Items
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK"
  >("ALL");
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const [itemsTotalEntries, setItemsTotalEntries] = useState(0);

  // Modal Visibility States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemData | null>(
    null,
  );

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemData | null>(
    null,
  );

  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<InventoryCategoryData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ---------------------------------------------------------
  // FETCH HELPERS
  // ---------------------------------------------------------

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await getInventoryCategories();
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchIntakeBatches = async () => {
    setIsBatchesLoading(true);
    try {
      const res = await getStockIntakeBatches();
      if (res.success && res.batches) {
        setBatches(res.batches);
      }
    } finally {
      setIsBatchesLoading(false);
    }
  };

  const fetchItems = async (
    page: number,
    query: string,
    catId: string,
    statusFilter: "ALL" | "GOOD" | "LOW_STOCK" | "OUT_OF_STOCK",
  ) => {
    setIsItemsLoading(true);
    try {
      const res = await getInventoryItems(page, 10, query, catId, statusFilter);
      if (res.success && res.items) {
        setItems(res.items);
        setItemsTotalPages(res.totalPages || 1);
        setItemsTotalEntries(res.total || 0);
      }
    } finally {
      setIsItemsLoading(false);
    }
  };

  const fetchAllItemsUnpaginated = async () => {
    const res = await getInventoryItems(1, 1000, "", "ALL", "ALL");
    if (res.success && res.items) {
      setAllItems(res.items);
    }
  };

  // Initial Load
  useEffect(() => {
    void Promise.resolve().then(() =>
      Promise.all([
        fetchCategories(),
        fetchIntakeBatches(),
        fetchAllItemsUnpaginated(),
      ]),
    );
  }, []);

  // Items Filter Effect
  useEffect(() => {
    void Promise.resolve().then(() =>
      fetchItems(
        itemsPage,
        searchQuery,
        selectedCategoryFilter,
        stockStatusFilter,
      ),
    );
  }, [itemsPage, searchQuery, selectedCategoryFilter, stockStatusFilter]);

  const refreshAllData = async () => {
    await Promise.all([
      fetchCategories(),
      fetchIntakeBatches(),
      fetchAllItemsUnpaginated(),
      fetchItems(
        itemsPage,
        searchQuery,
        selectedCategoryFilter,
        stockStatusFilter,
      ),
    ]);
  };

  const navTabs = useMemo(
    () => [
      {
        id: "items" as const,
        label: "Stock Items & Raw Materials",
        icon: Boxes,
        count: itemsTotalEntries,
      },
      {
        id: "intakes" as const,
        label: "Stock Intake Batches",
        icon: PackagePlus,
        count: batches.length,
      },
      {
        id: "categories" as const,
        label: "Categories",
        icon: Layers,
        count: categories.length,
      },
    ],
    [itemsTotalEntries, batches.length, categories.length],
  );

  // ---------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------

  // Item Handlers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItemData) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (data: {
    name: string;
    categoryId: string;
    unit: InventoryUnit;
    quantity?: number;
    minStockLevel?: number;
    unitCost?: number;
  }) => {
    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateInventoryItem(editingItem.id, data);
      } else {
        res = await createInventoryItem(data);
      }

      if (res.success) {
        toast.success(
          editingItem
            ? "Inventory item updated successfully!"
            : "Inventory item created successfully!",
        );
        setIsItemModalOpen(false);
        await refreshAllData();
      } else {
        toast.error(res.error || "Failed to save item.");
      }
    });
  };

  const handleDeleteItem = async (id: string, name: string) => {
    setItemToDelete({ id, name });
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;

    const { id, name } = itemToDelete;
    startTransition(async () => {
      const res = await deleteInventoryItem(id);
      if (res.success) {
        toast.success(`"${name}" deleted.`);
        setItemToDelete(null);
        await refreshAllData();
      } else {
        toast.error(res.error || "Failed to delete item.");
      }
    });
  };

  // Quick Stock Adjustment Handler
  const handleOpenAdjustStock = (item: InventoryItemData) => {
    setAdjustingItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustStock = async (data: {
    inventoryItemId: string;
    quantityChange: number;
    type: StockMovementType;
    reason?: string;
  }) => {
    startTransition(async () => {
      const res = await adjustStock(data);
      if (res.success) {
        toast.success("Stock adjustment logged successfully!");
        setIsAdjustModalOpen(false);
        await refreshAllData();
      } else {
        toast.error(res.error || "Failed to apply stock adjustment.");
      }
    });
  };

  // Stock Intake Batch Handler
  const handleOpenAddIntake = () => {
    if (allAllItems.length === 0) {
      toast.error(
        "Please add raw material inventory items before recording stock intake.",
      );
      return;
    }
    setIsIntakeModalOpen(true);
  };

  const handleSaveIntake = async (data: {
    notes?: string;
    items: Array<{
      inventoryItemId: string;
      quantity: number;
      unitCost: number;
    }>;
  }) => {
    startTransition(async () => {
      const res = await createStockIntakeBatch(data);
      if (res.success) {
        toast.success(
          `Stock Intake Batch ${res.batchNumber} recorded & stock updated!`,
        );
        setIsIntakeModalOpen(false);
        await refreshAllData();
      } else {
        toast.error(res.error || "Failed to record stock intake.");
      }
    });
  };

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: InventoryCategoryData) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (data: { name: string }) => {
    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateInventoryCategory(editingCategory.id, data);
      } else {
        res = await createInventoryCategory(data);
      }

      if (res.success) {
        toast.success(
          editingCategory ? "Category updated!" : "Category created!",
        );
        setIsCategoryModalOpen(false);
        await fetchCategories();
      } else {
        toast.error(res.error || "Failed to save category.");
      }
    });
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    startTransition(async () => {
      const res = await deleteInventoryCategory(id);
      if (res.success) {
        toast.success(`Category "${name}" deleted.`);
        setCategoryToDelete(null);
        await fetchCategories();
      } else {
        toast.error(res.error || "Failed to delete category.");
      }
    });
  };

  const handleRequestDeleteCategory = (id: string, name: string) => {
    setCategoryToDelete({ id, name });
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <Header title="Inventory & Stock Management" />

      <main className="flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)] mt-4">
        {/* Action Controls Banner */}
        <div className="w-full flex items-center justify-end">
          <div className="w-fit flex flex-col md:flex-row md:items-center justify-center gap-4 bg-white p-[clamp(1rem,2vw,1.5rem)] shadow-2xs border border-slate-200">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                icon={<FolderPlus size={18} />}
                onClick={handleOpenAddCategory}
              >
                Add Category
              </Button>
              <Button
                variant="outline"
                icon={<Plus size={18} />}
                onClick={handleOpenAddItem}
              >
                Add Raw Material Item
              </Button>
              <Button
                variant="primary"
                icon={<PackagePlus size={18} />}
                onClick={handleOpenAddIntake}
              >
                Record Stock Intake
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs  */}
        <div className="w-full">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-[clamp(0.875rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vw,0.75rem)] text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer outline-none border shadow-2xs",
                    isActive
                      ? "bg-(--color-primary) text-white border-(--color-primary) shadow-sm scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold ml-1",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "items" && (
          <InventoryItemsTable
            items={items}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setItemsPage(1);
            }}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={(catId) => {
              setSelectedCategoryFilter(catId);
              setItemsPage(1);
            }}
            stockStatusFilter={stockStatusFilter}
            onStockStatusFilterChange={(status) => {
              setStockStatusFilter(status);
              setItemsPage(1);
            }}
            currentPage={itemsPage}
            totalPages={itemsTotalPages}
            totalEntries={itemsTotalEntries}
            isLoading={isItemsLoading}
            onPageChange={(page) => setItemsPage(page)}
            onEdit={handleOpenEditItem}
            onDelete={handleDeleteItem}
            onAdjustStock={handleOpenAdjustStock}
          />
        )}

        {activeTab === "intakes" && (
          <StockIntakeTable batches={batches} isLoading={isBatchesLoading} />
        )}

        {activeTab === "categories" && (
          <InventoryCategoriesTable
            categories={categories}
            isLoading={isCategoriesLoading}
            onEdit={handleOpenEditCategory}
            onDelete={handleRequestDeleteCategory}
          />
        )}
      </main>

      {/* Modals */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItem={editingItem}
        categories={categories}
        onSave={handleSaveItem}
        isPending={isPending}
      />

      <StockAdjustmentModal
        key={`${isAdjustModalOpen}-${adjustingItem?.id ?? "none"}`}
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        item={adjustingItem}
        onSave={handleSaveAdjustStock}
        isPending={isPending}
      />

      <StockIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        inventoryItems={allAllItems}
        onSave={handleSaveIntake}
        isPending={isPending}
      />

      <InventoryCategoryModal
        key={`${isCategoryModalOpen ? "open" : "closed"}-${editingCategory?.id ?? "new"}`}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        isPending={isPending}
      />

      <ConfirmModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDeleteItem}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${itemToDelete?.name ?? ""}"?`}
        confirmText="Confirm"
        isLoading={isPending}
      />

      <ConfirmModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            void handleDeleteCategory(
              categoryToDelete.id,
              categoryToDelete.name,
            );
          }
        }}
        title="Delete Inventory Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name ?? ""}"?`}
        confirmText="Confirm"
        isLoading={isPending}
      />
    </div>
  );
}
