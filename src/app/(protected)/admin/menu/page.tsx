"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Utensils, Plus, Layers, Sliders, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  MenuItemData,
  CategoryData,
  AddOnData,
} from "@/actions/menu";

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

  // Loading States
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isAddOnsLoading, setIsAddOnsLoading] = useState(true);

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
    setIsCategoriesLoading(true);
    try {
      const res = await getCategories();
      if (res.success && res.categories) {
        setCategories(res.categories);
      }
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const fetchAddOns = async () => {
    setIsAddOnsLoading(true);
    try {
      const res = await getAddOns();
      if (res.success && res.addOns) {
        setAddOns(res.addOns);
      }
    } finally {
      setIsAddOnsLoading(false);
    }
  };

  const fetchItems = async (
    page: number,
    query: string,
    catId: string,
    stockFilter: "ALL" | "AVAILABLE" | "OUT_OF_STOCK",
  ) => {
    setIsItemsLoading(true);
    try {
      let availFilter: boolean | undefined = undefined;
      if (stockFilter === "AVAILABLE") availFilter = true;
      if (stockFilter === "OUT_OF_STOCK") availFilter = false;

      const res = await getMenuItems(page, 10, query, catId, availFilter);
      if (res.success && res.items) {
        setItems(res.items);
        setTotalPages(res.totalPages || 1);
        setTotalEntries(res.total || 0);
      }
    } finally {
      setIsItemsLoading(false);
    }
  };

  // Reload items on filter changes asynchronously
  useEffect(() => {
    let isMounted = true;
    setIsItemsLoading(true);
    let availFilter: boolean | undefined = undefined;
    if (stockStatusFilter === "AVAILABLE") availFilter = true;
    if (stockStatusFilter === "OUT_OF_STOCK") availFilter = false;

    getMenuItems(
      currentPage,
      10,
      searchQuery,
      selectedCategoryFilter,
      availFilter,
    )
      .then((res) => {
        if (isMounted && res.success && res.items) {
          setItems(res.items);
          setTotalPages(res.totalPages || 1);
          setTotalEntries(res.total || 0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsItemsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchQuery, selectedCategoryFilter, stockStatusFilter]);

  // Initial data fetch for Categories and Add-Ons
  useEffect(() => {
    let isMounted = true;

    setIsCategoriesLoading(true);
    getCategories()
      .then((res) => {
        if (isMounted && res.success && res.categories) {
          setCategories(res.categories);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCategoriesLoading(false);
        }
      });

    setIsAddOnsLoading(true);
    getAddOns()
      .then((res) => {
        if (isMounted && res.success && res.addOns) {
          setAddOns(res.addOns);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAddOnsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const navTabs = useMemo(
    () => [
      {
        id: "items" as const,
        label: "Food Items & Stock Control",
        icon: Utensils,
        count: totalEntries,
      },
      {
        id: "addons" as const,
        label: "Add-Ons & Modifiers",
        icon: Sliders,
        count: addOns.length,
      },
      {
        id: "categories" as const,
        label: "Categories",
        icon: Layers,
        count: categories.length,
      },
    ],
    [totalEntries, addOns.length, categories.length],
  );

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

  const handleSaveCategory = async (data: { name: string }) => {
    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategory(editingCategory.id, data.name);
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
    <div className="min-h-screen bg-[var(--color-page-bg)] p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />

      {/* Header */}
      <Header title="Menu Management" />

      <main className="flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)] mt-4">
        {/* Banner Controls */}
        <div className="w-full flex items-center justify-end">
          <div className="w-fit flex flex-col md:flex-row md:items-center justify-center gap-4 bg-white p-[clamp(1rem,2vw,1.5rem)] shadow-2xs border border-slate-200">
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
        </div>

        {/* Navigation Tabs (POS Style) */}
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
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-[1.02]"
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
            isLoading={isItemsLoading}
            onPageChange={(page) => setCurrentPage(page)}
            onEdit={handleOpenEditItem}
            onDelete={handleDeleteItem}
          />
        )}

        {activeTab === "addons" && (
          <AddOnsTable
            addOns={addOns}
            isLoading={isAddOnsLoading}
            onEdit={handleOpenEditAddOn}
            onDelete={handleDeleteAddOn}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTable
            categories={categories}
            isLoading={isCategoriesLoading}
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
