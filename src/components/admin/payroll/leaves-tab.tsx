"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/shared/filters/activity-filters";
import { Edit, Trash2, Plus } from "lucide-react";
import { getEmployees, EmployeeData } from "@/actions/employees";
import {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
} from "@/actions/payroll";

export function LeavesTab() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("ALL");

  const [editLeaveModal, setEditLeaveModal] = useState<any | null>(null);
  const [newLeaveModal, setNewLeaveModal] = useState(false);
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  useEffect(() => {
    fetchLeavesAndEmployees();
  }, []);

  const fetchLeavesAndEmployees = async () => {
    setIsLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        getLeaves(),
        getEmployees(1, 100),
      ]);
      if (leavesRes.success && leavesRes.leaves) {
        setLeaves(leavesRes.leaves);
      }
      if (empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeavesOnly = async () => {
    const res = await getLeaves();
    if (res.success && res.leaves) {
      setLeaves(res.leaves);
    }
  };

  const formattedLeaves = useMemo(() => {
    return leaves.map((l) => ({
      ...l,
      employeeName: l.user?.fullName || "N/A",
      startDate: new Date(l.startDate).toLocaleDateString(),
      endDate: new Date(l.endDate).toLocaleDateString(),
    }));
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    return formattedLeaves.filter((l) => {
      const matchesStatus =
        leaveStatusFilter === "ALL" || l.status === leaveStatusFilter;
      const matchesType =
        leaveTypeFilter === "ALL" || l.type === leaveTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [formattedLeaves, leaveStatusFilter, leaveTypeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters
        selectFilters={[
          {
            id: "leaveStatus",
            label: "Status",
            value: leaveStatusFilter,
            options: [
              { value: "ALL", label: "All Statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ],
            onChange: setLeaveStatusFilter,
          },
          {
            id: "leaveType",
            label: "Leave Type",
            value: leaveTypeFilter,
            options: [
              { value: "ALL", label: "All Types" },
              { value: "CASUAL", label: "Casual" },
              { value: "SICK", label: "Sick" },
              { value: "UNPAID", label: "Unpaid" },
            ],
            onChange: setLeaveTypeFilter,
          },
        ]}
      >
        <div className="flex items-end">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setNewLeaveModal(true)}
            className="w-full sm:w-auto"
          >
            Add Leave Record
          </Button>
        </div>
      </ActivityFilters>

      <DataTable
        heading="Employee Leaves"
        TableHeaders={[
          { key: "employeeName", label: "Employee" },
          { key: "type", label: "Leave Type" },
          { key: "startDate", label: "Start Date" },
          { key: "endDate", label: "End Date" },
          { key: "status", label: "Status" },
          { key: "reason", label: "Reason" },
        ]}
        TableData={filteredLeaves}
        currentPage={1}
        totalPages={1}
        totalEntries={filteredLeaves.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-white" />,
            text: "Edit / Approve",
            className: "bg-[var(--color-primary)] hover:opacity-90 ",
            onClick: (row) => setEditLeaveModal(row),
          },
          {
            icon: <Trash2 size={16} className="text-white" />,
            text: "Delete",
            className: "bg-red-500 hover:bg-red-600 ",
            onClick: async (row) => {
              if (
                window.confirm(
                  "Are you sure you want to delete this leave record?"
                )
              ) {
                await deleteLeave((row as any).id);
                fetchLeavesOnly();
              }
            },
          },
        ]}
      />

      {/* Edit Leave Modal */}
      <Modal
        isOpen={!!editLeaveModal}
        onClose={() => setEditLeaveModal(null)}
        title="Edit / Approve Leave"
        className="max-w-2xl"
      >
        {editLeaveModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingLeave(true);
              try {
                const formData = new FormData(e.currentTarget);
                await updateLeave(editLeaveModal.id, {
                  status: formData.get("status"),
                  type: formData.get("type"),
                });
                setEditLeaveModal(null);
                fetchLeavesOnly();
              } finally {
                setIsSavingLeave(false);
              }
            }}
            className="p-4 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Status"
                name="status"
                defaultValue={editLeaveModal.status}
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "REJECTED", label: "Rejected" },
                ]}
              />
              <Select
                label="Leave Type"
                name="type"
                defaultValue={editLeaveModal.type}
                options={[
                  { value: "CASUAL", label: "Casual" },
                  { value: "SICK", label: "Sick" },
                  { value: "UNPAID", label: "Unpaid" },
                ]}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditLeaveModal(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSavingLeave}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* New Leave Modal */}
      <Modal
        isOpen={newLeaveModal}
        onClose={() => setNewLeaveModal(false)}
        title="Add Leave Record"
        className="max-w-2xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSavingLeave(true);
            try {
              const formData = new FormData(e.currentTarget);
              await createLeave({
                userId: formData.get("userId"),
                startDate: new Date(formData.get("startDate") as string),
                endDate: new Date(formData.get("endDate") as string),
                type: formData.get("type"),
                reason: formData.get("reason"),
                status: "APPROVED",
              });
              setNewLeaveModal(false);
              fetchLeavesOnly();
            } finally {
              setIsSavingLeave(false);
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
              label="Start Date"
              name="startDate"
              type="date"
              required
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              required
            />
            <Select
              label="Leave Type"
              name="type"
              required
              options={[
                { value: "CASUAL", label: "Casual" },
                { value: "SICK", label: "Sick" },
                { value: "UNPAID", label: "Unpaid" },
              ]}
            />
            <Input
              label="Reason"
              name="reason"
              type="text"
              required
              placeholder="e.g. Family emergency"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewLeaveModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingLeave}>
              Add Leave
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
