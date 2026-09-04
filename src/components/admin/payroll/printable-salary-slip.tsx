"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PrintableSalarySlipProps {
  payroll: any;
  month: number;
  year: number;
}

export function PrintableSalarySlip({
  payroll,
  month,
  year,
}: PrintableSalarySlipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !payroll) return null;

  return createPortal(
    <div id="salary-slip-print-container">
      <div className="bg-white p-6 max-w-xl mx-auto space-y-4 text-slate-900 font-sans text-xs">
        {/* Header */}
        <div className="text-center pb-3 border-b border-slate-400">
          <h1 className="font-black text-lg uppercase tracking-wider">
            {process.env.NEXT_PUBLIC_RESTAURANT_NAME ||
              "RESTAURANT MANAGEMENT SYSTEM"}
          </h1>
          <h2 className="font-bold text-xs uppercase tracking-widest text-slate-600 mt-0.5">
            Salary Payment Slip
          </h2>
          <p className="text-[0.68rem] text-slate-500 mt-0.5">
            Pay Period:{" "}
            {new Date(year, month - 1).toLocaleString("default", {
              month: "long",
            })}{" "}
            {year} | Date: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>

        {/* Basic Employee Info */}
        <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-200">
          <div>
            <span className="text-slate-500">Employee Name:</span>{" "}
            <strong className="text-slate-900">{payroll.employeeName}</strong>
          </div>
          <div>
            <span className="text-slate-500">Role / Position:</span>{" "}
            <span className="font-semibold text-slate-800">
              {payroll.user?.role || "Staff"}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Working / Present:</span>{" "}
            <span>
              {payroll.workingDays || 0} / {payroll.presentDays || 0} Days
            </span>
          </div>
          <div>
            <span className="text-slate-500">Payment Status:</span>{" "}
            <strong className="text-emerald-700">{payroll.status}</strong>
          </div>
        </div>

        {/* Salary Breakdown Table */}
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-400 text-left font-bold text-slate-700 uppercase text-[0.65rem]">
              <th className="py-1">Description</th>
              <th className="py-1 text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-1.5">Basic Salary</td>
              <td className="py-1.5 text-right font-medium">
                {payroll.basicSalary}
              </td>
            </tr>
            {Number(String(payroll.overtimePay).replace(/[^0-9.]/g, "")) >
              0 && (
              <tr>
                <td className="py-1.5">Overtime Pay</td>
                <td className="py-1.5 text-right font-medium">
                  {payroll.overtimePay}
                </td>
              </tr>
            )}
            {Number(String(payroll.bonus).replace(/[^0-9.]/g, "")) > 0 && (
              <tr>
                <td className="py-1.5">Bonus / Allowances</td>
                <td className="py-1.5 text-right font-medium">
                  {payroll.bonus}
                </td>
              </tr>
            )}
            {Number(
              String(payroll.carriedOverBalance).replace(/[^0-9.]/g, ""),
            ) > 0 && (
              <tr>
                <td className="py-1.5">Carried Over Arrears</td>
                <td className="py-1.5 text-right font-medium">
                  {payroll.carriedOverBalance}
                </td>
              </tr>
            )}
            {Number(String(payroll.deductions).replace(/[^0-9.]/g, "")) >
              0 && (
              <tr>
                <td className="py-1.5 text-rose-700">
                  Deductions (Absent/Unpaid)
                </td>
                <td className="py-1.5 text-right text-rose-700 font-medium">
                  -{payroll.deductions}
                </td>
              </tr>
            )}
            {Number(String(payroll.advance).replace(/[^0-9.]/g, "")) > 0 && (
              <tr>
                <td className="py-1.5 text-rose-700">
                  Advance Salary Recovered
                </td>
                <td className="py-1.5 text-right text-rose-700 font-medium">
                  -{payroll.advance}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900 font-bold text-sm">
              <td className="py-2 text-slate-900">Net Salary Paid</td>
              <td className="py-2 text-right text-emerald-800 font-black">
                {payroll.alreadyPaid || payroll.netSalary}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-400 w-32 mx-auto mb-1" />
            <span className="text-slate-600">Employee Signature</span>
          </div>
          <div>
            <div className="border-b border-slate-400 w-32 mx-auto mb-1" />
            <span className="text-slate-600">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
