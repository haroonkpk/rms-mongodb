"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/shared/filters/activity-filters";
import { PrintPdfButton } from "@/components/shared/print-pdf-button";
import { Edit, CheckCircle, Play, Printer } from "lucide-react";
import {
  generateMonthlyPayroll,
  getPayrolls,
  updatePayrollRecord,
  markPayrollPaid,
} from "@/actions/payroll";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const payrollHeaders: TableHeader[] = [
  { key: "employeeName", label: "Employee Name" },
  { key: "basicSalary", label: "Basic Salary" },
  { key: "overtimePay", label: "Overtime Pay" },
  { key: "bonus", label: "Bonus" },
  { key: "deductions", label: "Deductions" },
  { key: "advance", label: "Advance" },
  { key: "netSalary", label: "Net Salary" },
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

  const handleMarkPaid = async (payrollId: string) => {
    const method = window.prompt(
      "Enter payment method (CASH, BANK_TRANSFER, CHEQUE):",
      "CASH"
    );
    if (!method) return;
    await markPayrollPaid(payrollId, method);
    fetchPayrolls();
  };

  const generatePayslip = (payroll: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Salary Payslip", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Employee Name: ${payroll.employeeName}`, 14, 40);
    doc.text(`Month/Year: ${month}/${year}`, 14, 48);
    doc.text(`Status: ${payroll.status}`, 14, 56);
    doc.text(
      `Working Days: ${payroll.workingDays} | Present: ${payroll.presentDays} | Absent: ${payroll.absentDays} | Leave: ${payroll.leaveDays}`,
      14,
      64
    );

    autoTable(doc, {
      startY: 75,
      head: [["Description", "Amount"]],
      body: [
        ["Basic Salary", payroll.basicSalary],
        ["Overtime Pay", payroll.overtimePay],
        ["Bonus", payroll.bonus],
        ["Deductions (Absent/Unpaid Leave)", payroll.deductions],
        ["Salary Advance Deducted", payroll.advance],
        ["Net Salary", payroll.netSalary],
      ],
      theme: "grid",
      headStyles: { fillColor: [5, 59, 112] },
    });

    doc.save(
      `Payslip_${payroll.employeeName.replace(/\s+/g, "_")}_${month}_${year}.pdf`
    );
  };

  const formattedPayrolls = useMemo(() => {
    return payrolls.map((p) => ({
      ...p,
      employeeName: p.user?.fullName || "N/A",
      basicSalary: `Rs ${p.basicSalary}`,
      overtimePay: `Rs ${p.overtimePay || 0}`,
      bonus: `Rs ${p.bonus || 0}`,
      deductions: `Rs ${p.deductions || 0}`,
      advance: `Rs ${p.advance || 0}`,
      netSalary: `Rs ${p.netSalary}`,
      status: p.status,
    }));
  }, [payrolls]);

  const filteredPayrolls = useMemo(() => {
    return formattedPayrolls.filter((p) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "PAID") return p.status === "PAID";
      if (statusFilter === "PENDING") return p.status !== "PAID";
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
              { value: "PENDING", label: "Pending Payments" },
              { value: "PAID", label: "Paid Payments" },
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
            { month: "long" }
          )} ${year}`}
          headers={payrollHeaders}
          data={filteredPayrolls}
          fileName={`Payroll_${year}_${month}`}
        />
      </div>

      <DataTable
        heading={`Payroll for ${new Date(year, month - 1).toLocaleString(
          "default",
          { month: "long" }
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
            onClick: (row) => {
              if ((row as any).status === "PAID") {
                if (
                  !window.confirm(
                    "WARNING: This payroll is already PAID. Making corrections here will recalculate the Net Salary and alter history. Are you sure you want to edit it?"
                  )
                )
                  return;
              }
              setEditPayrollModal(row);
            },
          },
          {
            icon: <Printer size={16} className="text-white" />,
            text: "Payslip",
            className: "bg-blue-600 hover:bg-blue-700 ",
            onClick: (row) => generatePayslip(row),
          },
          {
            icon: <CheckCircle size={16} className="text-white" />,
            text: "Mark as Paid",
            className: "bg-green-600 hover:bg-green-700 ",
            onClick: (row) => {
              if ((row as any).status !== "PAID") {
                handleMarkPaid((row as any).id);
              } else {
                alert("Already marked as paid");
              }
            },
          },
        ]}
      />

      {/* Edit Payroll Modal */}
      <Modal
        isOpen={!!editPayrollModal}
        onClose={() => setEditPayrollModal(null)}
        title={`Update Payroll - ${editPayrollModal?.employeeName || ""}`}
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
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-2">
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
              <div className="col-span-2">
                <span className="text-slate-500">OT Hours:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {editPayrollModal.totalOvertimeHours}
                </span>
              </div>
            </div>

            <Select
              label="Status"
              name="status"
              defaultValue={editPayrollModal.status}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "APPROVED", label: "Approved" },
                { value: "PAID", label: "Paid" },
              ]}
            />

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

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPayrollModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSavingPayroll}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
