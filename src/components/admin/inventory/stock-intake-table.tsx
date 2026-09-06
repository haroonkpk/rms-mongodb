"use client";

import React, { useState } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { StockIntakeBatchData } from "@/actions/inventory";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PackageCheck, Eye } from "lucide-react";

interface StockIntakeTableProps {
  batches: StockIntakeBatchData[];
  isLoading: boolean;
}

export const StockIntakeTable: React.FC<StockIntakeTableProps> = ({
  batches,
  isLoading,
}) => {
  const [selectedBatch, setSelectedBatch] = useState<StockIntakeBatchData | null>(null);

  const tableHeaders: TableHeader[] = [
    { key: "batchFormatted", label: "Batch No / Ref" },
    { key: "totalFormatted", label: "Total Cost (PKR)" },
    { key: "countFormatted", label: "Items Count" },
    { key: "notesFormatted", label: "Notes / Description" },
  ];

  const formattedData = batches.map((batch) => ({
    id: batch.id,
    batchFormatted: (
      <div className="flex items-center gap-2">
        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
          <PackageCheck size={16} />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-xs">{batch.batchNumber}</div>
          <div className="text-[0.7rem] text-slate-500">
            {new Date(batch.createdAt).toLocaleString("en-GB")}
          </div>
        </div>
      </div>
    ),
    totalFormatted: (
      <span className="font-black text-slate-900 text-xs">
        PKR {batch.totalAmount.toLocaleString()}
      </span>
    ),
    countFormatted: (
      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
        {batch.items.length} raw material{batch.items.length === 1 ? "" : "s"}
      </span>
    ),
    notesFormatted: (
      <span className="text-xs text-slate-600 truncate max-w-[200px] block">
        {batch.notes || "—"}
      </span>
    ),
    rawBatch: batch,
  }));

  const tableButtons = [
    {
      icon: <Eye size={15} />,
      text: "View Details",
      className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200",
      onClick: (row: (typeof formattedData)[0]) => setSelectedBatch(row.rawBatch),
    },
  ];

  return (
    <>
      <DataTable
        heading="Stock Intake Batches History"
        TableHeaders={tableHeaders}
        TableData={formattedData}
        TableButtons={tableButtons}
        isLoading={isLoading}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />

      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={`Batch Details: ${selectedBatch.batchNumber}`}
          className="max-w-xl"
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Received At:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(selectedBatch.createdAt).toLocaleString("en-GB")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total Cost:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  PKR {selectedBatch.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {selectedBatch.notes && (
              <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-md text-amber-900">
                <span className="font-bold block mb-0.5">Batch Notes:</span>
                {selectedBatch.notes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase">
                Items Arrived in this Batch:
              </h4>
              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {selectedBatch.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2.5 bg-white border border-slate-200 text-xs rounded-md"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {item.inventoryItemName}
                      </span>
                      <span className="text-[0.7rem] text-slate-500">
                        Qty Arrived: {item.quantity} | Unit Cost: PKR {item.unitCost}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      PKR {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
