"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layouts";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { UserProfileModal } from "@/components/shared/user-profile-modal";
import { Eye, Edit } from "lucide-react";
import { getEmployees, EmployeeData } from "@/actions/employees";

const tableHeaders: TableHeader[] = [
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email Address" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "shiftTiming", label: "Shift Timing" },
  { key: "monthlyBaseSalary", label: "Base Salary" },
];

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Modal State for "View User"
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployeesList = async (page: number) => {
    setLoading(true);
    const res = await getEmployees(page, 10);
    if (res.success && res.employees) {
      setEmployees(res.employees);
      setTotalPages(res.totalPages || 1);
      setTotalEntries(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployeesList(currentPage);
  }, [currentPage]);

  const formattedEmployees = React.useMemo(() => {
    return employees.map((emp) => ({
      ...emp,
      fullName: emp.fullName || "N/A",
      shiftTiming: emp.shiftTiming ? emp.shiftTiming.replace("_", " ") : "—",
      monthlyBaseSalary: emp.monthlyBaseSalary
        ? `Rs ${emp.monthlyBaseSalary.toLocaleString()}`
        : "—",
    }));
  }, [employees]);

  const handleOpenViewModal = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleEditRedirect = (employee: any) => {
    router.push(`/admin/employees/${employee.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Employee & Staff Management" />

      {/* Main Grid Layout */}
      <main className="flex flex-col gap-8">
        {/* ── LEFT: Employees Data Table  ── */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <DataTable
            heading="All Employees & Staff"
            TableHeaders={tableHeaders}
            TableData={formattedEmployees}
            currentPage={currentPage}
            totalPages={totalPages}
            totalEntries={totalEntries}
            onPageChange={(page) => setCurrentPage(page)}
            TableButtons={[
              {
                icon: (
                  <Eye
                    size={16}
                    className="text-slate-600 group-hover:text-slate-900"
                  />
                ),
                text: "View Profile",
                className: "bg-slate-100 hover:bg-slate-200 ",
                onClick: (row) => handleOpenViewModal(row),
              },
              {
                icon: <Edit size={16} className="text-white" />,
                text: "Edit Employee",
                className: "bg-[var(--color-primary)] hover:opacity-90 ",
                onClick: (row) => handleEditRedirect(row),
              },
            ]}
          />
        </div>

        {/* ── bottom: Create New User link  ── */}
        <div className="w-full flex justify-end">
          <Link
            href="/admin/employees/new"
            className="text-blue-500 text-sm p-4 underline hover:opacity-80 transition-opacity flex items-center gap-1.5"
          >
            <span>Create New Employee Account</span>
          </Link>
        </div>
      </main>

      {/*   MODAL */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        onEdit={handleEditRedirect}
      />
    </div>
  );
}
