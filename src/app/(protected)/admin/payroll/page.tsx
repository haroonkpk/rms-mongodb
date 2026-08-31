"use client";

import React, { useState } from "react";
import { Header } from "@/components/layouts";
import { cn } from "@/lib/utils";
import { Banknote, Calendar, BookOpen } from "lucide-react";
import {
  PayrollTab,
  AttendanceTab,
  LeavesTab,
  SalaryAdvancesTab,
} from "@/components/admin/payroll";

export default function AdminPayrollPage() {
  const [activeTab, setActiveTab] = useState<
    "PAYROLL" | "ATTENDANCE" | "LEAVES" | "ADVANCE"
  >("PAYROLL");

  const mainTabs = [
    {
      id: "PAYROLL" as const,
      label: "Monthly Payroll",
      icon: <Banknote size={18} />,
    },
    {
      id: "ATTENDANCE" as const,
      label: "Attendance Tracking",
      icon: <Calendar size={18} />,
    },
    {
      id: "LEAVES" as const,
      label: "Leave Management",
      icon: <BookOpen size={18} />,
    },
    {
      id: "ADVANCE" as const,
      label: "Salary Advances",
      icon: <Banknote size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Payroll & Attendance" />

      {/* POS Style Category Tabs */}
      <div className="w-full mb-[clamp(1rem,2vw,1.5rem)]">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-0.5">
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-[clamp(0.875rem,1.5vw,1.25rem)] py-[clamp(0.5rem,1vw,0.75rem)] rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer outline-none border shadow-2xs",
                  isActive
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex flex-col gap-6">
        {activeTab === "PAYROLL" && <PayrollTab />}
        {activeTab === "ATTENDANCE" && <AttendanceTab />}
        {activeTab === "LEAVES" && <LeavesTab />}
        {activeTab === "ADVANCE" && <SalaryAdvancesTab />}
      </main>
    </div>
  );
}
