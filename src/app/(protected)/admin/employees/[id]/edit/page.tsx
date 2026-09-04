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

const shiftOptions = [
  { value: "", label: "Select Shift" },
  { value: "DAY", label: "Day Shift" },
  { value: "NIGHT", label: "Night Shift" },
  { value: "DUAL", label: "Dual Shift" },
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
      <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 font-medium">
          {error || "Employee not found"}
        </p>
        <Link href="/admin/employees">
          <Button variant="outline" icon={<ArrowLeft size={18} />}>
            Back to Employees
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Edit Employee Profile" />

      <main className="max-w-4xl mx-auto flex flex-col gap-6 mt-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/employees">
            <Button
              variant="outline"
              icon={<ArrowLeft size={18} />}
              className="text-xs"
            >
              Back to Employee List
            </Button>
          </Link>
        </div>

        <Card variant="white" className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                <CheckCircle2 size={18} />
                <span>Employee updated successfully! Redirecting...</span>
              </div>
            )}

            {/* Profile Avatar Upload with Cloudinary */}
            <ImageUploader
              label="Profile Picture "
              name="avatarUrl"
              value={employee.avatarUrl || ""}
            />

            {/* SECTION 1: Personal & Account Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide border-b pb-2">
                1. Account Credentials & Basic Info
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
                <Input
                  label="New Password (Optional)"
                  name="password"
                  type="password"
                  placeholder="Leave empty to keep current password"
                />
              </div>
            </div>

            {/* SECTION 2: Role & Employment Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide border-b pb-2">
                2. Role & Employment Details
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
                  label="Daily Shift Hours (Standard)"
                  name="dailyShiftHours"
                  type="number"
                  step="0.5"
                  defaultValue={
                    employee.dailyShiftHours !== null
                      ? employee.dailyShiftHours
                      : 8
                  }
                  placeholder="e.g. 8 or 10"
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
