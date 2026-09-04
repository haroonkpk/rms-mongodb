"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteEmployee, EmployeeData } from "@/actions/employees";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeData | null;
  onSuccess: () => void;
}

export function DeleteEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: DeleteEmployeeModalProps) {
  const [adminPassword, setAdminPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setAdminPassword("");
    setError(null);
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!adminPassword.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsDeleting(true);
    setError(null);

    const res = await deleteEmployee(employee.id, adminPassword);
    setIsDeleting(false);

    if (res.success) {
      handleClose();
      onSuccess();
    } else {
      setError(res.error || "Failed to delete employee");
    }
  };

  if (!employee || employee.role === "ADMIN") return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Employee"
      className="max-w-sm"
    >
      <form onSubmit={handleDelete} className="flex flex-col gap-4 py-1">
        <p className="text-sm text-slate-600">
          Enter admin password to delete{" "}
          <strong className="text-slate-900">
            {employee.fullName || employee.email}
          </strong>.
        </p>

        <div className="flex flex-col gap-2">
          <Input
            label="Admin Password"
            type="password"
            placeholder="Enter password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isDeleting}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </form>
    </Modal>
  );
}
