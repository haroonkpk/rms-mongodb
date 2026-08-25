"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layouts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { ArrowLeft, UserPlus, AlertCircle } from "lucide-react";
import { createEmployee } from "@/actions/employees";

const roleOptions = [
  { value: "CASHIER", label: "Cashier" },
  { value: "CHEF", label: "Chef" },
  { value: "ADMIN", label: "Administrator" },
];

const shiftOptions = [
  { value: "", label: "Select Shift (Optional)" },
  { value: "MORNING", label: "Morning (06:00 - 14:00)" },
  { value: "EVENING", label: "Evening (16:00 - 00:00)" },
  { value: "NIGHT", label: "Night (22:00 - 06:00)" },
  { value: "FULL_DAY", label: "Full Day (12:00 - 22:00)" },
];

export default function CreateEmployeePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createEmployee(formData);
      if (res.success) {
        router.push("/admin/employees");
      } else {
        setError(res.error || "Failed to create employee");
      }
    });
  };

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

      <Header title="Create Employee Profile" />

      <main className="max-w-4xl mx-auto">
        <Card
          variant="white"
          className="p-[clamp(1.5rem,3vw,2.5rem)] border border-slate-200/80 shadow-xs"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm font-medium">
                <AlertCircle size={20} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Avatar Upload with Cloudinary */}
            <ImageUploader
              label="Profile Picture "
              name="avatarUrl"
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
                  placeholder="e.g. Ahmad Khan"
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="e.g. ahmad@restaurant.com"
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +92 300 1234567"
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="password"
                  required
                />
              </div>
            </div>

            {/* SECTION 2: Role, Status & Compensation */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide border-b pb-2">
                2. Role & Employment Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Access Role"
                  name="role"
                  options={roleOptions}
                  defaultValue="CASHIER"
                  required
                />
                <Select
                  label="Shift Timing"
                  name="shiftTiming"
                  options={shiftOptions}
                />
                <Input
                  label="Monthly Base Salary (PKR)"
                  name="monthlyBaseSalary"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 45000"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                icon={<UserPlus size={18} />}
              >
                Create Employee Account
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
