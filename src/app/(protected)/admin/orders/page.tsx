"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
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
  });
  const [clientFilters, setClientFilters] = useState({
    paymentMethod: "ALL",
    orderType: "ALL",
  });
  const [orderSearch, setOrderSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(filters);
  const [allRows, setAllRows] = useState<
    Array<Record<string, string | number>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const hasLoadedInitialData = useRef(false);

  const load = async (requestFilters: ReportFilters) => {
    setIsLoading(true);
    try {
      const result = await getCompletedOrderReport(requestFilters);
      setAllRows(result);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedInitialData.current) return;
    hasLoadedInitialData.current = true;
    void load({ period: "THIS_MONTH" });
  }, []);

  const updateDraft = (key: keyof ReportFilters, value: string) =>
    setDraftFilters((current) => ({ ...current, [key]: value }));

  const clearCustomFilter = () => {
    const defaultFilters: ReportFilters = {
      period: "THIS_MONTH",
      paymentMethod: "ALL",
      orderType: "ALL",
    };
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setClientFilters({ paymentMethod: "ALL", orderType: "ALL" });
    void load(defaultFilters);
  };

  useEffect(() => {
    const orderNumber = orderSearch.trim();
    if (!orderNumber) return;

    const timeout = window.setTimeout(() => {
      void load({ ...filters, orderNumber });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [orderSearch, filters]);

  const handleOrderSearchChange = (value: string) => {
    setOrderSearch(value);
    if (!value.trim()) void load(filters);
  };

  const applyCustomFilter = () => {
    if (
      draftFilters.period === "CUSTOM" &&
      draftFilters.startDate &&
      draftFilters.endDate
    ) {
      setFilters(draftFilters);
      void load(draftFilters);
    }
  };

  const rows = useMemo(
    () =>
      allRows.filter((row) => {
        const matchesPayment =
          clientFilters.paymentMethod === "ALL" ||
          row.payment === clientFilters.paymentMethod.replaceAll("_", " ");
        const orderTypeLabels: Record<string, string> = {
          DINE_IN: "Dine-In",
          TAKEAWAY: "Takeaway",
          DELIVERY: "Delivery",
        };
        const matchesOrderType =
          clientFilters.orderType === "ALL" ||
          row.orderType === orderTypeLabels[clientFilters.orderType];
        return matchesPayment && matchesOrderType;
      }),
    [allRows, clientFilters],
  );

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Completed Orders" />
      <main className="mt-4 flex flex-col gap-6">
        <div className="flex justify-end items-center">
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 justify-between w-fit border border-slate-200 bg-white p-4 shadow-2xs">
            <Select
              label="Period"
              value={draftFilters.period}
              onChange={(event) =>
                event.target.value === "THIS_MONTH"
                  ? clearCustomFilter()
                  : updateDraft("period", event.target.value)
              }
              options={[
                { value: "THIS_MONTH", label: "This Month" },
                { value: "CUSTOM", label: "Custom range" },
              ]}
            />
            {draftFilters.period === "CUSTOM" && (
              <>
                <Input
                  label="From"
                  type="date"
                  value={draftFilters.startDate ?? ""}
                  onChange={(event) =>
                    updateDraft("startDate", event.target.value)
                  }
                />
                <Input
                  label="To"
                  type="date"
                  value={draftFilters.endDate ?? ""}
                  onChange={(event) =>
                    updateDraft("endDate", event.target.value)
                  }
                />
              </>
            )}
            {filters.period === "CUSTOM" ? (
              <Button
                variant="outline"
                icon={<X size={16} />}
                onClick={clearCustomFilter}
              >
                Clear
              </Button>
            ) : draftFilters.period === "CUSTOM" ? (
              <Button
                variant="primary"
                icon={<Filter size={16} />}
                onClick={applyCustomFilter}
                disabled={!draftFilters.startDate || !draftFilters.endDate}
              >
                Apply
              </Button>
            ) : null}
          </div>
        </div>

        <ReportDetailTable
          heading="Orders"
          rows={rows}
          isLoading={isLoading}
          onView={(row) => {
            const details = row.orderDetails;
            if (typeof details === "string") {
              setSelectedOrder(JSON.parse(details) as OrderDetails);
            }
          }}
          headerActions={
            <div className="flex items-center gap-2">
              <Input
                aria-label="Search by order ID"
                className="w-48!"
                placeholder="ORD-20260919-6583"
                value={orderSearch}
                onChange={(event) =>
                  handleOrderSearchChange(event.target.value)
                }
              />
              <Select
                aria-label="Filter orders by payment method"
                value={clientFilters.paymentMethod}
                onChange={(event) =>
                  setClientFilters((current) => ({
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
              <Select
                aria-label="Filter orders by order type"
                value={clientFilters.orderType}
                onChange={(event) =>
                  setClientFilters((current) => ({
                    ...current,
                    orderType: event.target.value,
                  }))
                }
                options={[
                  { value: "ALL", label: "All Order Types" },
                  { value: "DINE_IN", label: "Dine-In" },
                  { value: "TAKEAWAY", label: "Takeaway" },
                  { value: "DELIVERY", label: "Delivery" },
                ]}
              />
            </div>
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
