"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Utensils, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { POSMenuItem } from "@/types";

interface ItemGridProps {
  items: POSMenuItem[];
  selectedCategoryId: string;
  onSelectItem: (item: POSMenuItem) => void;
}

export function ItemGrid({
  items,
  selectedCategoryId,
  onSelectItem,
}: ItemGridProps) {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        selectedCategoryId !== "ALL" &&
        item.categoryId !== selectedCategoryId
      ) {
        return false;
      }

      return true;
    });
  }, [items, selectedCategoryId]);

  return (
    <div className="flex-1 min-w-0">
      {/* Food Items Grid */}
      {filteredItems.length === 0 ? (
        <Card
          variant="white"
          className=" border border-slate-200 text-center py-12 px-4"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Utensils size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No items available
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are currently no items in this section. Add items from Admin
            Menu Management.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[clamp(0.75rem,1.5vw,1.25rem)]">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              variant="white"
              onClick={() => item.isAvailable && onSelectItem(item)}
              className={cn(
                " border border-slate-200/90 shadow-2xs transition-all duration-200 flex flex-col justify-between p-[clamp(0.875rem,1.5vw,1.125rem)] group cursor-pointer",
                item.isAvailable
                  ? "hover:border-[var(--color-primary)]/50 hover:shadow-md"
                  : "opacity-70 bg-slate-50/70 border-dashed cursor-not-allowed",
              )}
            >
              <div>
                {/* Image Container */}
                <div className="relative w-full h-[clamp(8rem,14vw,10rem)] rounded-[clamp(0.5rem,1vw,0.875rem)] bg-slate-100 overflow-hidden mb-3 group-hover:scale-[1.01] transition-transform">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                      <Utensils size={32} />
                      <span className="text-[0.65rem] uppercase font-bold tracking-wider mt-1 text-slate-400">
                        {item.categoryName}
                      </span>
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute top-2 right-2">
                    {item.isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-bold bg-emerald-500 text-white shadow-xs">
                        <CheckCircle2 size={10} />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.65rem] font-bold bg-rose-600 text-white shadow-xs">
                        <AlertCircle size={10} />
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded-md text-[0.65rem] font-semibold bg-slate-900/80 backdrop-blur-xs text-white">
                      {item.categoryName}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                  {item.description || "No description available."}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  Rs.
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {item.basePrice.toFixed(2)}
                  </span>
                </div>

                <Button
                  variant={item.isAvailable ? "primary" : "outline"}
                  disabled={!item.isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.isAvailable) onSelectItem(item);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                  className="text-xs py-2 px-3 font-semibold h-auto"
                >
                  Add Item
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
