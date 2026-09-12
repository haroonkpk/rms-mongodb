"use client";

import { useEffect, useState, useTransition } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  recordCustomerPayment,
  updateCustomer,
} from "@/actions/customers";
import { Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CustomerDetailsModal,
  CustomerFormModal,
  CustomerRecord,
} from "@/components/customers/customer-modals";

const customerTableHeaders: TableHeader[] = [
  { key: "name", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "totalOrders", label: "Orders" },
  { key: "ledgerBalance", label: "Ledger Balance" },
  { key: "status", label: "Status" },
];

export function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<CustomerRecord | null>(null);
  const [formCustomer, setFormCustomer] = useState<
    CustomerRecord | null | undefined
  >(undefined);
  const [customerToDelete, setCustomerToDelete] =
    useState<CustomerRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = async () => {
    setIsLoading(true);
    const result = await getCustomers(search, status);
    if (result.success) setCustomers(result.customers as CustomerRecord[]);
    else toast.error(result.error ?? "Unable to load customers");
    setIsLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadCustomers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const openDetails = (customer: CustomerRecord) => setSelected(customer);

  const saveCustomer = (data: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    status: "ACTIVE" | "INACTIVE";
  }) => {
    startTransition(async () => {
      const result = formCustomer
        ? await updateCustomer(formCustomer.id, data)
        : await createCustomer(data);
      if (!result.success) {
        toast.error(result.error ?? "Unable to save customer");
        return;
      }
      toast.success(formCustomer ? "Customer updated" : "Customer created");
      setFormCustomer(undefined);
      await loadCustomers();
    });
  };

  const removeCustomer = () => {
    if (!customerToDelete) return;
    startTransition(async () => {
      const result = await deleteCustomer(customerToDelete.id);
      if (!result.success) {
        toast.error(result.error ?? "Unable to delete customer");
        return;
      }
      toast.success("Customer deleted");
      setCustomerToDelete(null);
      await loadCustomers();
    });
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Toaster position="top-right" />
      <Header title="Customers Management" />
      <main className="mt-4 flex flex-col gap-5">
        <div className="flex justify-end">
          <div className="flex flex-col gap-3 border border-slate-200 bg-white p-4 shadow-2xs md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative w-full sm:max-w-md">
                <Input
                  label="Search customers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, phone, or email"
                  className="pr-10"
                />
                <Search className="absolute right-3 bottom-3.5 h-4 w-4 text-slate-400" />
              </div>
              <Select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={[
                  { value: "ALL", label: "All customers" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                ]}
              />
            </div>
            <Button
              icon={<Plus size={17} />}
              onClick={() => setFormCustomer(null)}
            >
              Add Customer
            </Button>
          </div>
        </div>

        <DataTable
          heading="Customers"
          TableHeaders={customerTableHeaders}
          TableData={customers}
          currentPage={1}
          totalPages={1}
          onPageChange={() => undefined}
          totalEntries={customers.length}
          isLoading={isLoading}
          TableButtons={[
            {
              text: "View details",
              icon: <Eye size={16} />,
              className:
                "bg-(--color-page-bg) text-(--color-primary) border border-(--color-secondary-bg)",
              onClick: openDetails,
            },
            {
              text: "Edit customer",
              icon: <Pencil size={16} />,
              className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
              onClick: setFormCustomer,
            },
            {
              text: "Delete customer",
              icon: <Trash2 size={16} />,
              className:
                "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100",
              onClick: setCustomerToDelete,
            },
          ]}
        />
      </main>

      {formCustomer !== undefined && (
        <CustomerFormModal
          customer={formCustomer}
          isPending={isPending}
          onClose={() => setFormCustomer(undefined)}
          onSave={saveCustomer}
        />
      )}
      <CustomerDetailsModal
        customer={selected}
        isPending={isPending}
        onClose={() => setSelected(null)}
        onPayment={async (amount, note) => {
          if (!selected) return;
          const result = await recordCustomerPayment({
            customerId: selected.id,
            amount,
            note,
          });
          if (!result.success)
            toast.error(result.error ?? "Unable to record payment");
          else {
            toast.success("Payment recorded");
            const allocations = result.allocations ?? [];
            setSelected((current) =>
              current
                ? {
                    ...current,
                    ledgerBalance: current.ledgerBalance - amount,
                    ledgerEntries: [
                      {
                        id: `local-${Date.now()}`,
                        type: "PAYMENT",
                        amount,
                        note: note || null,
                        orderNumber: null,
                        createdAt: new Date().toISOString(),
                      },
                      ...current.ledgerEntries,
                    ],
                    orders: current.orders.map((order) => {
                      const allocation = allocations.find(
                        (item) => item.orderId === order.id,
                      );
                      return allocation
                        ? {
                            ...order,
                            dueAmount: allocation.dueAmount,
                            paymentStatus: allocation.paymentStatus,
                          }
                        : order;
                    }),
                  }
                : current,
            );
            await loadCustomers();
          }
        }}
      />
      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={removeCustomer}
        isLoading={isPending}
        title="Delete customer"
        message={`Delete ${customerToDelete?.name ?? "this customer"}? Existing orders will remain.`}
        confirmText="Delete customer"
      />
    </div>
  );
}
