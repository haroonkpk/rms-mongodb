"use client";

import React from "react";
import { PackageCheck } from "lucide-react";
import { StockIntakeBatchData } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface StockIntakeDetailsModalProps {
  batch: StockIntakeBatchData | null;
  onClose: () => void;
}

export const StockIntakeDetailsModal: React.FC<
  StockIntakeDetailsModalProps
> = ({ batch, onClose }) => {
  return (
    <Modal
      isOpen={!!batch}
      onClose={onClose}
      title="Stock Intake Details"
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      {batch && (
        <div className="flex flex-col gap-5 ">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className=" border border-(--color-secondary-bg) bg-(--color-page-bg) p-4">
              <span className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-(--color-primary)">
                Received At
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {new Date(batch.createdAt).toLocaleString("en-GB")}
              </span>
            </div>
            <div className=" border border-(--color-secondary-bg) bg-(--color-page-bg) p-4">
              <span className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-(--color-primary)">
                Total Cost
              </span>
              <span className="text-lg font-black text-(--color-primary)">
                PKR {batch.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {batch.notes && (
            <div className="border border-(--color-secondary-bg) bg-(--color-page-bg) px-4 py-3 text-sm text-slate-800">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-(--color-primary)">
                Notes
              </span>
              {batch.notes}
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                Items Received
              </h4>
              <span className="ml-auto text-xs font-semibold text-slate-500">
                {batch.items.length} item{batch.items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto  ">
              {batch.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${
                    index > 0 ? "border-t border-(--color-secondary-bg)" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-800">
                      {item.inventoryItemName}
                    </span>
                    <span className="text-xs text-slate-500">
                      Qty {item.quantity} | Unit cost PKR{" "}
                      {item.unitCost.toLocaleString()}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-slate-800">
                    PKR {item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end  pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
