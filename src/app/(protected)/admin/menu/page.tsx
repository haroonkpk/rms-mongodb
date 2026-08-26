"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Header } from "@/components/layouts";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  Utensils,
  Plus,
  Layers,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Sliders,
  FolderPlus,
} from "lucide-react";
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
  seedInitialMenuData,
  MenuItemData,
  CategoryData,
  AddOnData,
} from "@/actions/menu";

// Table Headers Definition
const itemTableHeaders: TableHeader[] = [
  { key: "imageDisplay", label: "Image" },
  { key: "nameDisplay", label: "Item Name & Details" },
  { key: "categoryBadge", label: "Category" },
  { key: "formattedPrice", label: "Base Price" },
  { key: "stockToggle", label: "POS Stock Status" },
];

const categoryTableHeaders: TableHeader[] = [
  { key: "name", label: "Category Name" },
  { key: "description", label: "Description" },
  { key: "itemCountBadge", label: "Total Items" },
];

const addOnTableHeaders: TableHeader[] = [
  { key: "name", label: "Add-On / Modifier Name" },
  { key: "formattedPrice", label: "Extra Price" },
  { key: "linkedItemBadge", label: "Linked Food Item" },
  { key: "availabilityToggle", label: "Availability Status" },
];

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

  // Item Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    categoryId: "",
    imageUrl: "",
    isAvailable: true,
  });

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(
    null,
  );
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });

  // Add-On Modal States
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOnData | null>(null);
  const [addOnFormData, setAddOnFormData] = useState({
    name: "",
    price: "",
    menuItemId: "GLOBAL",
    isAvailable: true,
  });

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

  // Initial load and seed
  useEffect(() => {
    let isMounted = true;
    startTransition(async () => {
      await seedInitialMenuData();
      if (!isMounted) return;

      const [catRes, addOnRes, itemRes] = await Promise.all([
        getCategories(),
        getAddOns(),
        getMenuItems(1, 10, "", "ALL", undefined),
      ]);

      if (isMounted) {
        if (catRes.success && catRes.categories)
          setCategories(catRes.categories);
        if (addOnRes.success && addOnRes.addOns) setAddOns(addOnRes.addOns);
        if (itemRes.success && itemRes.items) {
          setItems(itemRes.items);
          setTotalPages(itemRes.totalPages || 1);
          setTotalEntries(itemRes.total || 0);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Total Summary Stats
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

  // Category select options
  const categoryOptions: SelectOption[] = useMemo(() => {
    const opts = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
    return [{ value: "", label: "Select Category..." }, ...opts];
  }, [categories]);

  const categoryFilterOptions: SelectOption[] = useMemo(() => {
    const opts = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
    return [{ value: "ALL", label: "All Categories" }, ...opts];
  }, [categories]);

  const menuItemSelectOptions: SelectOption[] = useMemo(() => {
    const opts = items.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.categoryName})`,
    }));
    return [{ value: "GLOBAL", label: "All Items (Global Add-On)" }, ...opts];
  }, [items]);

  // ---------------------------------------------------------
  // HANDLERS FOR ITEM OPERATIONS
  // ---------------------------------------------------------
  const handleOpenAddItemModal = () => {
    setEditingItem(null);
    setItemFormData({
      name: "",
      description: "",
      basePrice: "",
      categoryId: categories[0]?.id || "",
      imageUrl: "",
      isAvailable: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item: MenuItemData) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      description: item.description || "",
      basePrice: item.basePrice.toString(),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || "",
      isAvailable: item.isAvailable,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.name.trim()) {
      toast.error("Please enter a valid item name.");
      return;
    }
    if (!itemFormData.categoryId) {
      toast.error("Please select a category.");
      return;
    }
    const priceNum = parseFloat(itemFormData.basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid base price.");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingItem) {
        res = await updateMenuItem(editingItem.id, {
          name: itemFormData.name,
          description: itemFormData.description,
          basePrice: priceNum,
          categoryId: itemFormData.categoryId,
          imageUrl: itemFormData.imageUrl,
          isAvailable: itemFormData.isAvailable,
        });
      } else {
        res = await createMenuItem({
          name: itemFormData.name,
          description: itemFormData.description,
          basePrice: priceNum,
          categoryId: itemFormData.categoryId,
          imageUrl: itemFormData.imageUrl,
          isAvailable: itemFormData.isAvailable,
        });
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
    // Optimistic UI Update
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
      // Rollback on error
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
  // HANDLERS FOR CATEGORY OPERATIONS
  // ---------------------------------------------------------
  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", description: "" });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name, description: cat.description || "" });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategory(
          editingCategory.id,
          categoryFormData.name,
          categoryFormData.description,
        );
      } else {
        res = await createCategory(
          categoryFormData.name,
          categoryFormData.description,
        );
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
  // HANDLERS FOR ADD-ON OPERATIONS
  // ---------------------------------------------------------
  const handleOpenAddAddOnModal = () => {
    setEditingAddOn(null);
    setAddOnFormData({
      name: "",
      price: "",
      menuItemId: "GLOBAL",
      isAvailable: true,
    });
    setIsAddOnModalOpen(true);
  };

  const handleOpenEditAddOnModal = (addon: AddOnData) => {
    setEditingAddOn(addon);
    setAddOnFormData({
      name: addon.name,
      price: addon.price.toString(),
      menuItemId: addon.menuItemId || "GLOBAL",
      isAvailable: addon.isAvailable,
    });
    setIsAddOnModalOpen(true);
  };

  const handleSaveAddOn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOnFormData.name.trim()) {
      toast.error("Add-on option name is required.");
      return;
    }
    const priceNum = parseFloat(addOnFormData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid extra price.");
      return;
    }

    startTransition(async () => {
      let res;
      const targetItemId =
        addOnFormData.menuItemId === "GLOBAL" ? null : addOnFormData.menuItemId;

      if (editingAddOn) {
        res = await updateAddOn(editingAddOn.id, {
          name: addOnFormData.name,
          price: priceNum,
          menuItemId: targetItemId,
          isAvailable: addOnFormData.isAvailable,
        });
      } else {
        res = await createAddOn({
          name: addOnFormData.name,
          price: priceNum,
          menuItemId: targetItemId,
          isAvailable: addOnFormData.isAvailable,
        });
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

  // ---------------------------------------------------------
  // FORMATTED TABLE DATA
  // ---------------------------------------------------------
  const formattedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      imageDisplay: (
        <div className="w-[clamp(2.5rem,4vw,3.5rem)] h-[clamp(2.5rem,4vw,3.5rem)] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Utensils size={20} className="text-slate-400" />
          )}
        </div>
      ),
      nameDisplay: (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 text-[clamp(0.875rem,1.1vw,1rem)]">
            {item.name}
          </span>
          {item.description ? (
            <p className="text-xs text-slate-500 max-w-xs line-clamp-1">
              {item.description}
            </p>
          ) : (
            <span className="text-xs text-slate-400 italic">
              No description
            </span>
          )}
        </div>
      ),
      categoryBadge: (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-secondary-bg)] text-[var(--color-primary)] border border-orange-200">
          {item.categoryName}
        </span>
      ),
      formattedPrice: (
        <span className="font-extrabold text-slate-900 text-[clamp(0.9rem,1.2vw,1.05rem)]">
          Rs {item.basePrice.toLocaleString()}
        </span>
      ),
      stockToggle: (
        <button
          type="button"
          onClick={() =>
            handleToggleItemAvailability(item.id, item.isAvailable)
          }
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            item.isAvailable
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
          }`}
          title="Click to toggle item ON/OFF on POS screens"
        >
          {item.isAvailable ? (
            <>
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Available (ON)</span>
            </>
          ) : (
            <>
              <XCircle size={15} className="text-rose-600" />
              <span>Out of Stock (OFF)</span>
            </>
          )}
        </button>
      ),
    }));
  }, [items]);

  const formattedCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      description: cat.description || "—",
      itemCountBadge: (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
          {cat.itemCount} Items
        </span>
      ),
    }));
  }, [categories]);

  const formattedAddOns = useMemo(() => {
    return addOns.map((addon) => ({
      ...addon,
      formattedPrice: (
        <span className="font-bold text-slate-900 text-sm">
          + Rs {addon.price.toLocaleString()}
        </span>
      ),
      linkedItemBadge: (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {addon.menuItemName}
        </span>
      ),
      availabilityToggle: (
        <button
          type="button"
          onClick={() =>
            handleToggleAddOnAvailability(addon.id, addon.isAvailable)
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            addon.isAvailable
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
          }`}
        >
          {addon.isAvailable ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Available</span>
            </>
          ) : (
            <>
              <XCircle size={14} className="text-amber-600" />
              <span>Disabled</span>
            </>
          )}
        </button>
      ),
    }));
  }, [addOns]);

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />

      {/* Top Page Header */}
      <Header title="Menu Management" />

      <main className="flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)] mt-4">
        {/* Top Header Controls Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-[clamp(1rem,2vw,1.5rem)] shadow-xs border border-slate-200">
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
              onClick={handleOpenAddCategoryModal}
            >
              Add Category
            </Button>
            <Button
              variant="outline"
              icon={<Sliders size={18} />}
              onClick={handleOpenAddAddOnModal}
            >
              Add Modifier / Add-On
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={18} />}
              onClick={handleOpenAddItemModal}
            >
              Add Food Item
            </Button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
          <Card
            variant="white"
            className="border border-slate-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Utensils size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Items
              </p>
              <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-slate-900">
                {stats.totalItems}
              </h3>
            </div>
          </Card>

          <Card
            variant="white"
            className="border border-slate-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Available on POS
              </p>
              <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-emerald-700">
                {stats.availableCount}
              </h3>
            </div>
          </Card>

          <Card
            variant="white"
            className="border border-slate-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Out of Stock
              </p>
              <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-rose-700">
                {stats.outOfStockCount}
              </h3>
            </div>
          </Card>

          <Card
            variant="white"
            className="border border-slate-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Categories
              </p>
              <h3 className="text-[clamp(1.25rem,1.8vw,1.6rem)] font-extrabold text-slate-900">
                {stats.categoryCount}
              </h3>
            </div>
          </Card>
        </div>

        {/* SECTION TABS */}
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

        {/* TAB 1: FOOD ITEMS & STOCK CONTROL */}
        {activeTab === "items" && (
          <div className="flex flex-col gap-4">
            {/* Filter Bar */}
            <Card variant="white" className="border border-slate-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Search Input */}
                <div className="relative">
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <Select
                    options={categoryFilterOptions}
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Stock Status Filter */}
                <div>
                  <Select
                    options={[
                      { value: "ALL", label: "All Stock Statuses" },
                      { value: "AVAILABLE", label: "Available (ON POS)" },
                      {
                        value: "OUT_OF_STOCK",
                        label: "Out of Stock (OFF POS)",
                      },
                    ]}
                    value={stockStatusFilter}
                    onChange={(e) => {
                      setStockStatusFilter(
                        e.target.value as "ALL" | "AVAILABLE" | "OUT_OF_STOCK",
                      );
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Menu Items Table */}
            <DataTable
              heading="All Food Menu Items"
              TableHeaders={itemTableHeaders}
              TableData={formattedItems}
              currentPage={currentPage}
              totalPages={totalPages}
              totalEntries={totalEntries}
              onPageChange={(page) => setCurrentPage(page)}
              TableButtons={[
                {
                  icon: <Edit size={16} className="text-slate-700" />,
                  text: "Edit Item",
                  className: "bg-slate-100 hover:bg-slate-200",
                  onClick: (row) =>
                    handleOpenEditItemModal(row as unknown as MenuItemData),
                },
                {
                  icon: <Trash2 size={16} className="text-rose-600" />,
                  text: "Delete Item",
                  className: "bg-rose-50 hover:bg-rose-100",
                  onClick: (row) =>
                    handleDeleteItem(
                      (row as unknown as MenuItemData).id,
                      (row as unknown as MenuItemData).name,
                    ),
                },
              ]}
            />
          </div>
        )}

        {/* TAB 2: ADD-ONS & MODIFIERS */}
        {activeTab === "addons" && (
          <div className="flex flex-col gap-4">
            <DataTable
              heading="Add-Ons & Extra Modifiers (e.g. Cheese, Sauces, Extra Patty)"
              TableHeaders={addOnTableHeaders}
              TableData={formattedAddOns}
              currentPage={1}
              totalPages={1}
              totalEntries={addOns.length}
              onPageChange={() => {}}
              TableButtons={[
                {
                  icon: <Edit size={16} className="text-slate-700" />,
                  text: "Edit Modifier",
                  className: "bg-slate-100 hover:bg-slate-200",
                  onClick: (row) =>
                    handleOpenEditAddOnModal(row as unknown as AddOnData),
                },
                {
                  icon: <Trash2 size={16} className="text-rose-600" />,
                  text: "Delete Modifier",
                  className: "bg-rose-50 hover:bg-rose-100",
                  onClick: (row) =>
                    handleDeleteAddOn(
                      (row as unknown as AddOnData).id,
                      (row as unknown as AddOnData).name,
                    ),
                },
              ]}
            />
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="flex flex-col gap-4">
            <DataTable
              heading="Menu Categories"
              TableHeaders={categoryTableHeaders}
              TableData={formattedCategories}
              currentPage={1}
              totalPages={1}
              totalEntries={categories.length}
              onPageChange={() => {}}
              TableButtons={[
                {
                  icon: <Edit size={16} className="text-slate-700" />,
                  text: "Edit Category",
                  className: "bg-slate-100 hover:bg-slate-200",
                  onClick: (row) =>
                    handleOpenEditCategoryModal(row as unknown as CategoryData),
                },
                {
                  icon: <Trash2 size={16} className="text-rose-600" />,
                  text: "Delete Category",
                  className: "bg-rose-50 hover:bg-rose-100",
                  onClick: (row) =>
                    handleDeleteCategory(
                      (row as unknown as CategoryData).id,
                      (row as unknown as CategoryData).name,
                    ),
                },
              ]}
            />
          </div>
        )}
      </main>

      {/* --------------------------------------------------------- */}
      {/* ADD/EDIT ITEM MODAL */}
      {/* --------------------------------------------------------- */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? "Edit Menu Food Item" : "Add New Menu Food Item"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSaveItem} className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              placeholder="e.g. Zinger Burger"
              value={itemFormData.name}
              onChange={(e) =>
                setItemFormData({ ...itemFormData, name: e.target.value })
              }
              required
            />

            <Select
              label="Category"
              options={categoryOptions}
              value={itemFormData.categoryId}
              onChange={(e) =>
                setItemFormData({ ...itemFormData, categoryId: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              label="Base Price (PKR)"
              type="number"
              step="0.01"
              placeholder="e.g. 950"
              value={itemFormData.basePrice}
              onChange={(e) =>
                setItemFormData({ ...itemFormData, basePrice: e.target.value })
              }
              required
            />

            {/* Stock Availability Toggle Switch */}
            <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Stock Availability
              </span>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={itemFormData.isAvailable}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      isAvailable: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                <span className="text-sm font-semibold text-slate-800">
                  {itemFormData.isAvailable
                    ? "Available ON POS"
                    : "Out of Stock"}
                </span>
              </label>
            </div>
          </div>

          <Textarea
            label="Description"
            placeholder="Describe ingredients, taste, or serving details..."
            value={itemFormData.description}
            onChange={(e) =>
              setItemFormData({ ...itemFormData, description: e.target.value })
            }
            rows={3}
          />

          {/* Image Uploader */}
          <div className="border-t border-slate-100 pt-3">
            <ImageUploader
              label="Food Item Image"
              name="itemImageUrl"
              value={itemFormData.imageUrl}
              onChange={(url) =>
                setItemFormData({ ...itemFormData, imageUrl: url })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsItemModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingItem ? "Save Changes" : "Create Food Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------- */}
      {/* ADD/EDIT CATEGORY MODAL */}
      {/* --------------------------------------------------------- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create New Category"}
        className="max-w-md"
      >
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-4 p-4">
          <Input
            label="Category Name"
            placeholder="e.g. Gourmet Burgers, Beverages, Desserts"
            value={categoryFormData.name}
            onChange={(e) =>
              setCategoryFormData({ ...categoryFormData, name: e.target.value })
            }
            required
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Brief description of this menu category..."
            value={categoryFormData.description}
            onChange={(e) =>
              setCategoryFormData({
                ...categoryFormData,
                description: e.target.value,
              })
            }
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --------------------------------------------------------- */}
      {/* ADD/EDIT ADD-ON MODAL */}
      {/* --------------------------------------------------------- */}
      <Modal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
        title={
          editingAddOn
            ? "Edit Add-On / Modifier"
            : "Create New Add-On / Modifier"
        }
        className="max-w-md"
      >
        <form onSubmit={handleSaveAddOn} className="flex flex-col gap-4 p-4">
          <Input
            label="Add-On Option Name"
            placeholder="e.g. Cheese Slice, Garlic Dip, Double Patty"
            value={addOnFormData.name}
            onChange={(e) =>
              setAddOnFormData({ ...addOnFormData, name: e.target.value })
            }
            required
          />

          <Input
            label="Extra Price (PKR)"
            type="number"
            step="0.01"
            placeholder="e.g. 120"
            value={addOnFormData.price}
            onChange={(e) =>
              setAddOnFormData({ ...addOnFormData, price: e.target.value })
            }
            required
          />

          <Select
            label="Associated Food Item"
            options={menuItemSelectOptions}
            value={addOnFormData.menuItemId}
            onChange={(e) =>
              setAddOnFormData({ ...addOnFormData, menuItemId: e.target.value })
            }
          />

          <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Option Availability
            </span>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addOnFormData.isAvailable}
                onChange={(e) =>
                  setAddOnFormData({
                    ...addOnFormData,
                    isAvailable: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
              <span className="text-sm font-semibold text-slate-800">
                {addOnFormData.isAvailable ? "Available ON POS" : "Disabled"}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOnModalOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isPending}>
              {editingAddOn ? "Update Modifier" : "Create Modifier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
