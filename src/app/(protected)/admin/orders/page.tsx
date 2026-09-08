"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ReportDetailTable } from "@/components/admin/reports/report-detail-table";
import { getCompletedOrderReport } from "@/actions/reports";
import {
  OrderDetails,
  OrderDetailsModal,
} from "@/components/admin/orders/order-details-modal";
import { ReportFilters } from "@/types/reports";

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    period: "THIS_MONTH",
    paymentMethod: "ALL",
  });
  const [rows, setRows] = useState<Array<Record<string, string | number>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await getCompletedOrderReport(filters);
      setRows(result);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.period,
    filters.paymentMethod,
    filters.startDate,
    filters.endDate,
  ]);

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Completed Orders" />
      <main className="mt-4 flex flex-col gap-6">
        <div className="flex justify-end items-center">
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 justify-between w-fit border border-slate-200 bg-white p-4 shadow-2xs">
            <Select
              label="Period"
              value={filters.period}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  period: event.target.value as ReportFilters["period"],
                }))
              }
              options={[
                { value: "THIS_MONTH", label: "This Month" },
                { value: "CUSTOM", label: "Custom range" },
              ]}
            />
            {filters.period === "CUSTOM" && (
              <>
                <Input
                  label="From"
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
                <Input
                  label="To"
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </>
            )}
            <Button
              variant="outline"
              icon={<RefreshCw size={16} />}
              onClick={() => void load()}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <ReportDetailTable
          heading="Completed Orders"
          rows={rows}
          isLoading={isLoading}
          onView={(row) => {
            const details = row.orderDetails;
            if (typeof details === "string") {
              setSelectedOrder(JSON.parse(details) as OrderDetails);
            }
          }}
          headerActions={
            <Select
              aria-label="Filter orders by payment method"
              value={filters.paymentMethod ?? "ALL"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  paymentMethod: event.target.value,
                }))
              }
              options={[
                { value: "ALL", label: "All Payments" },
                { value: "CASH", label: "Cash" },
                { value: "QR_CODE", label: "QR Code" },
                { value: "LEDGER", label: "Ledger" },
              ]}
            />
          }
        />
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      </main>
    </div>
  );
}
