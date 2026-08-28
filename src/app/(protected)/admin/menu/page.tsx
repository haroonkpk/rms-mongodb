"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Utensils, Plus, Layers, Sliders, FolderPlus } from "lucide-react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAddOns,
  createAddOn,
  updateAddOn,
  toggleAddOnAvailability,
  deleteAddOn,
  MenuItemData,
  CategoryData,
  AddOnData,
} from "@/actions/menu";

import { MenuStats } from "@/components/admin/menu/menu-stats";
import { MenuItemsTable } from "@/components/admin/menu/menu-items-table";
import { AddOnsTable } from "@/components/admin/menu/add-ons-table";
import { CategoriesTable } from "@/components/admin/menu/categories-table";
import { ItemModal } from "@/components/admin/menu/item-modal";
import { CategoryModal } from "@/components/admin/menu/category-modal";
import { AddOnModal } from "@/components/admin/menu/add-on-modal";

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<"items" | "addons" | "categories">(
    "items",
  );
  const [isPending, startTransition] = useTransition();

  // Data States
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [addOns, setAddOns] = useState<AddOnData[]>([]);

  // Filtering & Pagination States for Food Items
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "ALL" | "AVAILABLE" | "OUT_OF_STOCK"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modal Visibility & Editing States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(
    null,
  );

  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOnData | null>(null);

  // Data fetchers
  const fetchCategories = async () => {
    const res = await getCategories();
    if (res.success && res.categories) {
      setCategories(res.categories);
    }
  };

  const fetchAddOns = async () => {
    const res = await getAddOns();
    if (res.success && res.addOns) {
      setAddOns(res.addOns);
    }
  };

  const fetchItems = async (
    page: number,
    query: string,
    catId: string,
    stockFilter: "ALL" | "AVAILABLE" | "OUT_OF_STOCK",
  ) => {
    let availFilter: boolean | undefined = undefined;
    if (stockFilter === "AVAILABLE") availFilter = true;
    if (stockFilter === "OUT_OF_STOCK") availFilter = false;

    const res = await getMenuItems(page, 10, query, catId, availFilter);
    if (res.success && res.items) {
      setItems(res.items);
      setTotalPages(res.totalPages || 1);
      setTotalEntries(res.total || 0);
    }
  };

  // Reload items on filter changes asynchronously
  useEffect(() => {
    let isMounted = true;
    let availFilter: boolean | undefined = undefined;
    if (stockStatusFilter === "AVAILABLE") availFilter = true;
    if (stockStatusFilter === "OUT_OF_STOCK") availFilter = false;

    getMenuItems(
      currentPage,
      10,
      searchQuery,
      selectedCategoryFilter,
      availFilter,
    ).then((res) => {
      if (isMounted && res.success && res.items) {
        setItems(res.items);
        setTotalPages(res.totalPages || 1);
        setTotalEntries(res.total || 0);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchQuery, selectedCategoryFilter, stockStatusFilter]);

  // Initial data fetch for Categories and Add-Ons
  useEffect(() => {
    let isMounted = true;

    getCategories().then((res) => {
      if (isMounted && res.success && res.categories) {
        setCategories(res.categories);
      }
    });

    getAddOns().then((res) => {
      if (isMounted && res.success && res.addOns) {
        setAddOns(res.addOns);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Total Summary Stats`
  const stats = useMemo(() => {
    const totalItems = totalEntries;
    const availableCount = items.filter((i) => i.isAvailable).length;
    const outOfStockCount = items.filter((i) => !i.isAvailable).length;
    const categoryCount = categories.length;
    const addOnCount = addOns.length;

    return {
      totalItems,
      availableCount,
      outOfStockCount,
      categoryCount,
      addOnCount,
    };
  }, [totalEntries, items, categories, addOns]);

  // ---------------------------------------------------------
  // ITEM HANDLERS
  // ---------------------------------------------------------
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItemData) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (data: {
    name: string;
    description: string;
    basePrice: number;
    categoryId: string;
    imageUrl: string;
    isAvailable: boolean;
    hasSizes: boolean;
    sizes: { name: string; price: number }[];
    addOnIds: string[];
  }) => {
    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateMenuItem(editingItem.id, data);
      } else {
        res = await createMenuItem(data);
      }

      if (res.success) {
        toast.success(
          editingItem
            ? "Food item updated successfully!"
            : "Food item created successfully!",
        );
        setIsItemModalOpen(false);
        await Promise.all([
          fetchItems(
            currentPage,
            searchQuery,
            selectedCategoryFilter,
            stockStatusFilter,
          ),
          fetchCategories(),
        ]);
      } else {
        toast.error(res.error || "Failed to save menu item");
      }
    });
  };

  const handleToggleItemAvailability = async (
    id: string,
    currentStatus: boolean,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !currentStatus } : item,
      ),
    );

    const res = await toggleMenuItemAvailability(id, !currentStatus);
    if (res.success) {
      toast.success(
        res.isAvailable
          ? "Item turned ON (Available on POS)"
          : "Item turned OFF (Out of stock on POS)",
      );
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isAvailable: currentStatus } : item,
        ),
      );
      toast.error(res.error || "Failed to toggle stock status");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteMenuItem(id);
      if (res.success) {
        toast.success(`"${name}" deleted successfully.`);
        await Promise.all([
          fetchItems(
            currentPage,
            searchQuery,
            selectedCategoryFilter,
            stockStatusFilter,
          ),
          fetchCategories(),
        ]);
      } else {
        toast.error(res.error || "Failed to delete item.");
      }
    });
  };

  // ---------------------------------------------------------
  // CATEGORY HANDLERS
  // ---------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: CategoryData) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (data: {
    name: string;
  }) => {
    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategory(
          editingCategory.id,
          data.name,
        );
      } else {
        res = await createCategory(data.name);
      }

      if (res.success) {
        toast.success(
          editingCategory ? "Category updated!" : "Category created!",
        );
        setIsCategoryModalOpen(false);
        await Promise.all([
          fetchCategories(),
          fetchItems(
            currentPage,
            searchQuery,
            selectedCategoryFilter,
            stockStatusFilter,
          ),
        ]);
      } else {
        toast.error(res.error || "Failed to save category.");
      }
    });
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success(`Category "${name}" deleted.`);
        await Promise.all([
          fetchCategories(),
          fetchItems(
            currentPage,
            searchQuery,
            selectedCategoryFilter,
            stockStatusFilter,
          ),
        ]);
      } else {
        toast.error(res.error || "Failed to delete category.");
      }
    });
  };

  // ---------------------------------------------------------
  // ADD-ON HANDLERS
  // ---------------------------------------------------------
  const handleOpenAddAddOn = () => {
    setEditingAddOn(null);
    setIsAddOnModalOpen(true);
  };

  const handleOpenEditAddOn = (addon: AddOnData) => {
    setEditingAddOn(addon);
    setIsAddOnModalOpen(true);
  };

  const handleSaveAddOn = async (data: {
    name: string;
    price: number;
    isAvailable: boolean;
  }) => {
    startTransition(async () => {
      let res;
      if (editingAddOn) {
        res = await updateAddOn(editingAddOn.id, data);
      } else {
        res = await createAddOn(data);
      }

      if (res.success) {
        toast.success(editingAddOn ? "Add-on updated!" : "Add-on created!");
        setIsAddOnModalOpen(false);
        await fetchAddOns();
      } else {
        toast.error(res.error || "Failed to save add-on.");
      }
    });
  };

  const handleToggleAddOnAvailability = async (
    id: string,
    currentStatus: boolean,
  ) => {
    setAddOns((prev) =>
      prev.map((addon) =>
        addon.id === id ? { ...addon, isAvailable: !currentStatus } : addon,
      ),
    );

    const res = await toggleAddOnAvailability(id, !currentStatus);
    if (res.success) {
      toast.success(
        res.isAvailable ? "Add-on enabled on POS" : "Add-on disabled on POS",
      );
    } else {
      setAddOns((prev) =>
        prev.map((addon) =>
          addon.id === id ? { ...addon, isAvailable: currentStatus } : addon,
        ),
      );
      toast.error(res.error || "Failed to toggle add-on status");
    }
  };

  const handleDeleteAddOn = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete add-on "${name}"?`)) return;

    startTransition(async () => {
      const res = await deleteAddOn(id);
      if (res.success) {
        toast.success(`Add-on "${name}" deleted.`);
        await fetchAddOns();
      } else {
        toast.error(res.error || "Failed to delete add-on.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <Header title="Menu Management" />

      <main className="flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)] mt-4">
        {/* Banner Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-[clamp(1rem,2vw,1.5rem)] shadow-2xs border border-slate-200">
          <div>
            <h1 className="text-[clamp(1.25rem,2vw,1.75rem)] font-extrabold text-slate-900 flex items-center gap-2">
              <Utensils className="text-[var(--color-primary)]" size={28} />
              Menu & Catalog Management
            </h1>
            <p className="text-slate-500 text-[clamp(0.85rem,1vw,0.95rem)] mt-0.5">
              Manage food items, pricing, categories, add-on modifiers, and
              quick stock-out toggles for POS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              icon={<FolderPlus size={18} />}
              onClick={handleOpenAddCategory}
            >
              Add Category
            </Button>
            <Button
              variant="outline"
              icon={<Sliders size={18} />}
              onClick={handleOpenAddAddOn}
            >
              Add Modifier / Add-On
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={handleOpenAddItem}
            >
              Add Food Item
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <MenuStats
          totalItems={stats.totalItems}
          availableCount={stats.availableCount}
          outOfStockCount={stats.outOfStockCount}
          categoryCount={stats.categoryCount}
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 shadow-2xs gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "items"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Utensils size={18} />
            <span>Food Items & Stock Control</span>
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
              {stats.totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("addons")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "addons"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders size={18} />
            <span>Add-Ons & Modifiers</span>
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
              {stats.addOnCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "categories"
                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-orange-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers size={18} />
            <span>Categories</span>
            <span className="ml-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
              {stats.categoryCount}
            </span>
          </button>
        </div>

        {/* Tab Content Components */}
        {activeTab === "items" && (
          <MenuItemsTable
            items={items}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={(catId) => {
              setSelectedCategoryFilter(catId);
              setCurrentPage(1);
            }}
            stockStatusFilter={stockStatusFilter}
            onStockStatusFilterChange={(status) => {
              setStockStatusFilter(status);
              setCurrentPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            totalEntries={totalEntries}
            onPageChange={(page) => setCurrentPage(page)}
            onEdit={handleOpenEditItem}
            onDelete={handleDeleteItem}
            onToggleAvailability={handleToggleItemAvailability}
          />
        )}

        {activeTab === "addons" && (
          <AddOnsTable
            addOns={addOns}
            onEdit={handleOpenEditAddOn}
            onDelete={handleDeleteAddOn}
            onToggleAvailability={handleToggleAddOnAvailability}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTable
            categories={categories}
            onEdit={handleOpenEditCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </main>

      {/* Component Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        editingItem={editingItem}
        categories={categories}
        addOns={addOns}
        onSave={handleSaveItem}
        isPending={isPending}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        isPending={isPending}
      />

      <AddOnModal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        editingAddOn={editingAddOn}
        onSave={handleSaveAddOn}
        isPending={isPending}
      />
    </div>
  );
}
