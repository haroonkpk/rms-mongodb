"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/shared/filters/activity-filters";
import { PrintPdfButton } from "@/components/shared/print-pdf-button";
import { PrintableSalarySlip } from "./printable-salary-slip";
import { Edit, CheckCircle, Play, Printer } from "lucide-react";
import {
  generateMonthlyPayroll,
  getPayrolls,
  updatePayrollRecord,
  markPayrollPaid,
} from "@/actions/payroll";

const payrollHeaders: TableHeader[] = [
  { key: "employeeName", label: "Employee Name" },
  { key: "basicSalary", label: "Basic Salary" },
  { key: "overtimePay", label: "Overtime Pay" },
  { key: "bonus", label: "Bonus" },
  { key: "carriedOverBalance", label: "Carried Over" },
  { key: "deductions", label: "Deductions" },
  { key: "advance", label: "Advance" },
  { key: "alreadyPaid", label: "Already Paid" },
  { key: "netSalary", label: "Net Payable" },
  { key: "status", label: "Status" },
];

export function PayrollTab() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editPayrollModal, setEditPayrollModal] = useState<any | null>(null);
  const [isSavingPayroll, setIsSavingPayroll] = useState(false);
  const [payPayrollModal, setPayPayrollModal] = useState<any | null>(null);
  const [printablePayroll, setPrintablePayroll] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountToPay, setAmountToPay] = useState<string>("");
  const [payError, setPayError] = useState<string>("");
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const res = await getPayrolls(month, year);
      if (res.success && res.payrolls) {
        setPayrolls(res.payrolls);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      await generateMonthlyPayroll(month, year);
      await fetchPayrolls();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintSlip = (row: any) => {
    setPrintablePayroll(row);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const formattedPayrolls = useMemo(() => {
    return payrolls.map((p) => {
      const paid = Number(p.paidAmount || 0);
      const isPaidFull = p.status === "PAID";
      const displayStatus = isPaidFull
        ? "PAID"
        : paid > 0
          ? "DRAFT (Partial)"
          : "DRAFT";
      return {
        ...p,
        employeeName: p.user?.fullName || "N/A",
        basicSalary: `Rs ${p.basicSalary}`,
        overtimePay: `Rs ${p.overtimePay || 0}`,
        bonus: `Rs ${p.bonus || 0}`,
        carriedOverBalance: `Rs ${p.carriedOverBalance || 0}`,
        deductions: `Rs ${p.deductions || 0}`,
        advance: `Rs ${p.advance || 0}`,
        alreadyPaid: `Rs ${paid}`,
        netSalary: `Rs ${p.netSalary}`,
        status: displayStatus,
      };
    });
  }, [payrolls]);

  const filteredPayrolls = useMemo(() => {
    return formattedPayrolls.filter((p) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "PAID") return p.status === "PAID";
      if (statusFilter === "DRAFT") return p.status !== "PAID";
      return true;
    });
  }, [formattedPayrolls, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters
        selectFilters={[
          {
            id: "statusFilter",
            label: "Payment Status",
            value: statusFilter,
            options: [
              { value: "ALL", label: "All Statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "PAID", label: "Paid" },
            ],
            onChange: setStatusFilter,
          },
        ]}
      >
        <div>
          <Input
            label="Select Month & Year"
            type="month"
            value={`${year}-${String(month).padStart(2, "0")}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [y, m] = val.split("-");
                if (y && m) {
                  setYear(Number(y));
                  setMonth(Number(m));
                }
              }
            }}
          />
        </div>
      </ActivityFilters>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <Button
          variant="primary"
          icon={<Play size={16} />}
          isLoading={isGenerating}
          onClick={handleGeneratePayroll}
        >
          {isGenerating ? "Generating..." : "Generate Monthly Payroll"}
        </Button>

        <PrintPdfButton
          title={`Payroll - ${new Date(year, month - 1).toLocaleString(
            "default",
            { month: "long" },
          )} ${year}`}
          headers={payrollHeaders}
          data={filteredPayrolls}
          fileName={`Payroll_${year}_${month}`}
        />
      </div>

      <DataTable
        heading={`Payroll for ${new Date(year, month - 1).toLocaleString(
          "default",
          { month: "long" },
        )} ${year}`}
        TableHeaders={payrollHeaders}
        TableData={filteredPayrolls}
        currentPage={1}
        totalPages={1}
        totalEntries={filteredPayrolls.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-white" />,
            text: "Edit Deductions/Bonus",
            className: "bg-[var(--color-primary)] hover:opacity-90 ",
            show: (row: any) => row.status !== "PAID",
            onClick: (row) => setEditPayrollModal(row),
          },
          {
            icon: <Printer size={16} className="text-white" />,
            text: "Print Payslip",
            className: "bg-blue-600 hover:bg-blue-700 ",
            show: (row: any) => row.status === "PAID" || Number(row.paidAmount || 0) > 0,
            onClick: (row) => handlePrintSlip(row),
          },
          {
            icon: <CheckCircle size={16} className="text-white" />,
            text: "Pay Salary",
            className: "bg-green-600 hover:bg-green-700 ",
            show: (row: any) => row.status !== "PAID",
            onClick: (row) => {
              setPaymentMethod("CASH");
              const rawNet = row.netSalary
                ? String(row.netSalary).replace("Rs ", "")
                : "0";
              setAmountToPay(rawNet);
              setPayError("");
              setPayPayrollModal(row);
            },
          },
        ]}
      />

      {/* Edit Payroll Modal */}
      <Modal
        isOpen={!!editPayrollModal}
        onClose={() => setEditPayrollModal(null)}
        title={`Update Payroll - ${editPayrollModal?.employeeName || ""}`}
        className="max-w-2xl"
      >
        {editPayrollModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingPayroll(true);
              try {
                const formData = new FormData(e.currentTarget);
                await updatePayrollRecord(editPayrollModal.id, {
                  overtimePay: formData.get("overtimePay"),
                  bonus: formData.get("bonus"),
                  deductions: formData.get("deductions"),
                  advance: formData.get("advance"),
                  carriedOverBalance: formData.get("carriedOverBalance"),
                  status: formData.get("status"),
                });
                setEditPayrollModal(null);
                fetchPayrolls();
              } finally {
                setIsSavingPayroll(false);
              }
            }}
            className="p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 p-4 border border-slate-200/80 mb-2">
              <div>
                <span className="text-slate-500">Working Days:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.workingDays}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Present Days:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.presentDays}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Absent Days:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.absentDays}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Leave Days:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.leaveDays}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Already Paid:</span>{" "}
                <span className="font-bold text-blue-700">
                  {editPayrollModal.alreadyPaid}
                </span>
              </div>
              <div>
                <span className="text-slate-500">OT Hours:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.totalOvertimeHours}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Select
                  label="Status"
                  name="status"
                  defaultValue={
                    editPayrollModal.status.includes("DRAFT") ? "DRAFT" : "PAID"
                  }
                  options={[
                    { value: "DRAFT", label: "Draft" },
                    { value: "PAID", label: "Paid" },
                  ]}
                />
              </div>

              <Input
                label="Overtime Pay"
                name="overtimePay"
                type="number"
                defaultValue={
                  editPayrollModal.overtimePay
                    ? editPayrollModal.overtimePay.replace("Rs ", "")
                    : "0"
                }
              />

              <Input
                label="Bonus"
                name="bonus"
                type="number"
                defaultValue={
                  editPayrollModal.bonus
                    ? editPayrollModal.bonus.replace("Rs ", "")
                    : "0"
                }
              />

              <Input
                label="Carried Over Balance"
                name="carriedOverBalance"
                type="number"
                defaultValue={
                  editPayrollModal.carriedOverBalance
                    ? editPayrollModal.carriedOverBalance.replace("Rs ", "")
                    : "0"
                }
              />

              <Input
                label="Deductions"
                name="deductions"
                type="number"
                defaultValue={
                  editPayrollModal.deductions
                    ? editPayrollModal.deductions.replace("Rs ", "")
                    : "0"
                }
              />

              <Input
                label="Salary Advance"
                name="advance"
                type="number"
                defaultValue={
                  editPayrollModal.advance
                    ? editPayrollModal.advance.replace("Rs ", "")
                    : "0"
                }
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPayrollModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSavingPayroll}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={!!payPayrollModal}
        onClose={() => setPayPayrollModal(null)}
        title="Process Salary Payment"
        className="max-w-lg"
      >
        {payPayrollModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const maxPayable = Number(
                payPayrollModal.netSalary.replace("Rs ", ""),
              );
              const numPay = Number(amountToPay);
              if (!numPay || numPay <= 0) {
                setPayError("Payment amount must be greater than 0");
                return;
              }
              if (numPay > maxPayable) {
                setPayError(
                  `Payment amount cannot exceed remaining net payable (Rs ${maxPayable})`,
                );
                return;
              }

              setIsProcessingPay(true);
              try {
                const res = await markPayrollPaid(
                  payPayrollModal.id,
                  paymentMethod,
                  numPay,
                );
                if (res.success) {
                  setPayPayrollModal(null);
                  fetchPayrolls();
                } else {
                  setPayError(res.error || "Failed to process payment");
                }
              } finally {
                setIsProcessingPay(false);
              }
            }}
            className="space-y-4"
          >
            <div className="bg-slate-50 p-4 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Employee Name:
                </span>
                <span className="font-bold text-slate-900">
                  {payPayrollModal.employeeName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Month / Year:
                </span>
                <span className="font-semibold text-slate-800">
                  {new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {year}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Already Paid So Far:</span>
                <span className="font-semibold text-blue-700">
                  {payPayrollModal.alreadyPaid}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600 font-bold">
                  Net Salary Payable:
                </span>
                <span className="font-extrabold text-emerald-700 text-lg">
                  {payPayrollModal.netSalary}
                </span>
              </div>
            </div>

            <Input
              label="Amount to Pay (Rs)"
              type="number"
              value={amountToPay}
              onChange={(e) => {
                const val = e.target.value;
                setAmountToPay(val);
                const num = Number(val);
                const maxPayable = Number(
                  payPayrollModal.netSalary.replace("Rs ", ""),
                );
                if (num <= 0) {
                  setPayError("Payment amount must be greater than 0");
                } else if (num > maxPayable) {
                  setPayError(
                    `Payment amount cannot exceed remaining net payable (Rs ${maxPayable})`,
                  );
                } else {
                  setPayError("");
                }
              }}
              placeholder="Enter amount to pay"
            />
            {payError && (
              <p className="text-xs text-red-600 font-medium">{payError}</p>
            )}

            <Select
              label="Select Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "CASH", label: "Cash Payment" },
                { value: "BANK_TRANSFER", label: "Online / Bank Transfer" },
                { value: "CHEQUE", label: "Cheque" },
              ]}
            />

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayPayrollModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={
                  !!payError || !amountToPay || Number(amountToPay) <= 0
                }
                isLoading={isProcessingPay}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm & Mark Paid
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Container Component */}
      <PrintableSalarySlip
        payroll={printablePayroll}
        month={month}
        year={year}
      />
    </div>
  );
}
