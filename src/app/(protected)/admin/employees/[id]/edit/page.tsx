"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layouts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import {
  getEmployeeById,
  updateEmployee,
  EmployeeData,
} from "@/actions/employees";

const roleOptions = [
  { value: "CASHIER", label: "Cashier" },
  { value: "CHEF", label: "Chef" },
  { value: "ADMIN", label: "Administrator" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
];

const shiftOptions = [
  { value: "", label: "Select Shift (Optional)" },
  { value: "MORNING", label: "Morning (06:00 - 14:00)" },
  { value: "EVENING", label: "Evening (16:00 - 00:00)" },
  { value: "NIGHT", label: "Night (22:00 - 06:00)" },
  { value: "FULL_DAY", label: "Full Day (12:00 - 22:00)" },
];

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadEmployee() {
      setLoading(true);
      const res = await getEmployeeById(id);
      if (res.success && res.employee) {
        setEmployee(res.employee);
      } else {
        setError(res.error || "Failed to load employee");
      }
      setLoading(false);
    }
    loadEmployee();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateEmployee(id, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/employees");
        }, 1200);
      } else {
        setError(res.error || "Failed to update employee");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24 flex items-center justify-center">
        <p className="text-slate-600 font-medium">
          Loading employee profile...
        </p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-600 font-semibold">
          {error || "Employee record not found"}
        </p>
        <Link href="/admin/employees">
          <Button variant="outline">Back to Employees</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      {/* Top Header & Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Employees</span>
        </Link>
      </div>

      <Header title="Edit Employee Profile" />

      <main className="max-w-4xl mx-auto">
        <Card
          variant="white"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-medium">
                <AlertCircle size={20} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-medium">
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                <span>
                  Employee profile updated successfully! Redirecting...
                </span>
              </div>
            )}

            {/* Profile Avatar Upload with Cloudinary */}
            <ImageUploader
              label="Profile Picture "
              name="avatarUrl"
              value={employee.avatarUrl || ""}
            />

            {/* SECTION 1: Personal Info */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide border-b pb-2">
                1. Personal Information & Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  defaultValue={employee.fullName || ""}
                  placeholder="e.g. Ahmad Khan"
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  defaultValue={employee.email}
                  placeholder="e.g. ahmad@restaurant.com"
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  defaultValue={employee.phone || ""}
                  placeholder="e.g. +92 300 1234567"
                />
              </div>
            </div>

            {/* SECTION 2: Role, Status & Compensation */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide border-b pb-2">
                2. Role & Employment Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Access Role"
                  name="role"
                  options={roleOptions}
                  defaultValue={employee.role}
                  required
                />
                <Select
                  label="Employment Status"
                  name="status"
                  options={statusOptions}
                  defaultValue={employee.status}
                  required
                />
                <Select
                  label="Shift Timing"
                  name="shiftTiming"
                  options={shiftOptions}
                  defaultValue={employee.shiftTiming || ""}
                />
                <Input
                  label="Monthly Base Salary (PKR)"
                  name="monthlyBaseSalary"
                  type="number"
                  step="0.01"
                  defaultValue={
                    employee.monthlyBaseSalary !== null
                      ? employee.monthlyBaseSalary
                      : ""
                  }
                  placeholder="e.g. 45000"
                />
                <Input
                  label="Hired Date"
                  name="hiredAt"
                  type="date"
                  defaultValue={
                    employee.hiredAt ? employee.hiredAt.split("T")[0] : ""
                  }
                />
              </div>
            </div>

            {/* SECTION 3: Password Update Security */}
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <KeyRound size={18} className="text-amber-600" />
                <span>Password Update</span>
              </div>
              <p className="text-xs text-slate-600">
                Leave password field empty if you do not wish to change the
                user&apos;s password.
              </p>
              <div className="max-w-md">
                <Input
                  label="New Password (Optional)"
                  name="password"
                  type="password"
                  placeholder="Enter new password to update"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
              <Link href="/admin/employees">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                icon={<Save size={18} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
