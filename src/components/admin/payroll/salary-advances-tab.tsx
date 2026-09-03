"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/shared/filters/activity-filters";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEmployees, EmployeeData } from "@/actions/employees";
import { getSalaryAdvances, createSalaryAdvance } from "@/actions/payroll";

export function SalaryAdvancesTab() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [advanceSubTab, setAdvanceSubTab] = useState<"PENDING" | "DEDUCTED">(
    "PENDING"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [newAdvanceModal, setNewAdvanceModal] = useState(false);
  const [isSavingAdvance, setIsSavingAdvance] = useState(false);

  useEffect(() => {
    fetchAdvancesAndEmployees();
  }, [advanceSubTab]);

  const fetchAdvancesAndEmployees = async () => {
    setIsLoading(true);
    try {
      const [advRes, empRes] = await Promise.all([
        getSalaryAdvances(advanceSubTab),
        getEmployees(1, 100),
      ]);
      if (advRes.success && advRes.advances) {
        setAdvances(advRes.advances);
      }
      if (empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdvancesOnly = async () => {
    const res = await getSalaryAdvances(advanceSubTab);
    if (res.success && res.advances) {
      setAdvances(res.advances);
    }
  };

  const formattedAdvances = useMemo(() => {
    return advances.map((a) => ({
      ...a,
      employeeName: a.user?.fullName || "N/A",
      amount: `Rs ${a.amount}`,
      deductedAmount: `Rs ${a.deductedAmount}`,
      remainingAmount: `Rs ${Number(a.amount) - Number(a.deductedAmount)}`,
      createdAt: new Date(a.createdAt).toLocaleDateString("en-GB"),
    }));
  }, [advances]);

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters>
        <div className="flex items-end gap-2">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAdvanceSubTab("PENDING")}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer outline-none",
                advanceSubTab === "PENDING"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Pending Advances
            </button>
            <button
              type="button"
              onClick={() => setAdvanceSubTab("DEDUCTED")}
              className={cn(
                "flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer outline-none",
                advanceSubTab === "DEDUCTED"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Deducted Advances
            </button>
          </div>
        </div>

        <div className="flex items-end justify-end">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setNewAdvanceModal(true)}
            className="w-full sm:w-auto"
          >
            Issue Salary Advance
          </Button>
        </div>
      </ActivityFilters>

      <DataTable
        heading={
          advanceSubTab === "PENDING"
            ? "Pending Salary Advances"
            : "Deducted Salary Advances"
        }
        TableHeaders={[
          { key: "employeeName", label: "Employee" },
          { key: "amount", label: "Total Advance" },
          { key: "deductedAmount", label: "Deducted Amount" },
          { key: "remainingAmount", label: "Remaining Balance" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Issued Date" },
        ]}
        TableData={formattedAdvances}
        currentPage={1}
        totalPages={1}
        totalEntries={formattedAdvances.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[]}
      />

      {/* New Advance Modal */}
      <Modal
        isOpen={newAdvanceModal}
        onClose={() => setNewAdvanceModal(false)}
        title="Issue Salary Advance"
        className="max-w-2xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSavingAdvance(true);
            try {
              const formData = new FormData(e.currentTarget);
              await createSalaryAdvance(
                formData.get("userId") as string,
                Number(formData.get("amount")),
                formData.get("reason") as string
              );
              setNewAdvanceModal(false);
              fetchAdvancesOnly();
            } finally {
              setIsSavingAdvance(false);
            }
          }}
          className="p-4 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Select
                label="Employee"
                name="userId"
                required
                options={[
                  { value: "", label: "Select Employee" },
                  ...employees.map((emp) => ({
                    value: emp.id,
                    label: emp.fullName || emp.email || "Employee",
                  })),
                ]}
              />
            </div>
            <Input
              label="Amount (Rs)"
              name="amount"
              type="number"
              required
              placeholder="e.g. 5000"
            />
            <Input
              label="Reason"
              name="reason"
              type="text"
              placeholder="e.g. Emergency medical advance"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewAdvanceModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingAdvance}>
              Issue Advance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
