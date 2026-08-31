"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable, TableHeader } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityFilters } from "@/components/shared/filters/activity-filters";
import { Edit } from "lucide-react";
import { getEmployees, EmployeeData } from "@/actions/employees";
import { markAttendance, getAttendancesByDate } from "@/actions/payroll";

const attendanceHeaders: TableHeader[] = [
  { key: "employeeName", label: "Employee Name" },
  { key: "role", label: "Role" },
  { key: "status", label: "Attendance Status" },
  { key: "checkIn", label: "Check In" },
  { key: "checkOut", label: "Check Out" },
  { key: "overtimeHours", label: "Overtime Hours" },
];

function EditAttendanceFormModal({
  modalData,
  attendanceDate,
  onClose,
  onSave,
}: {
  modalData: any;
  attendanceDate: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const getInitTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [status, setStatus] = useState(
    modalData?.status === "NOT MARKED"
      ? "PRESENT"
      : modalData?.status || "PRESENT",
  );
  const [checkIn, setCheckIn] = useState(
    getInitTime(modalData?.originalAttendance?.checkIn),
  );
  const [checkOut, setCheckOut] = useState(
    getInitTime(modalData?.originalAttendance?.checkOut),
  );
  const [overtimeHours, setOvertimeHours] = useState<string | number>(
    modalData?.originalAttendance?.overtimeHours ??
      (modalData?.overtimeHours
        ? modalData.overtimeHours.toString().replace(" hrs", "")
        : "0"),
  );
  const [isOvertimeManuallyEdited, setIsOvertimeManuallyEdited] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculateOt = (cIn: string, cOut: string) => {
    if (cIn && cOut) {
      const inDate = new Date(`1970-01-01T${cIn}:00Z`);
      const outDate = new Date(`1970-01-01T${cOut}:00Z`);
      let diffHours = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60);
      if (diffHours < 0) diffHours += 24; // overnight shift
      if (diffHours > 9) {
        return parseFloat((diffHours - 9).toFixed(1));
      }
    }
    return 0;
  };

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCheckIn(val);
    if (!isOvertimeManuallyEdited) {
      setOvertimeHours(calculateOt(val, checkOut));
    }
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCheckOut(val);
    if (!isOvertimeManuallyEdited) {
      setOvertimeHours(calculateOt(checkIn, val));
    }
  };

  const handleOvertimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOvertimeHours(e.target.value);
    setIsOvertimeManuallyEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await markAttendance(
        modalData.id,
        attendanceDate,
        status as any,
        overtimeHours !== "" ? Number(overtimeHours) : undefined,
        checkIn || undefined,
        checkOut || undefined,
      );
      onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!modalData}
      onClose={onClose}
      title={`Mark Attendance - ${modalData?.employeeName || ""}`}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Check In"
            type="time"
            value={checkIn}
            onChange={handleCheckInChange}
          />

          <Input
            label="Check Out"
            type="time"
            value={checkOut}
            onChange={handleCheckOutChange}
          />

          <Select
            label="Attendance Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "PRESENT", label: "Present" },
              { value: "ABSENT", label: "Absent" },
              { value: "LATE", label: "Late" },
              { value: "HALF_DAY", label: "Half Day" },
            ]}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[clamp(0.7rem,1vw,0.8rem)] font-bold text-[#475569] uppercase tracking-wide">
                Overtime Hours
              </label>
              {isOvertimeManuallyEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOvertimeManuallyEdited(false);
                    setOvertimeHours(calculateOt(checkIn, checkOut));
                  }}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Reset to auto-calc
                </button>
              )}
            </div>
            <Input
              type="number"
              step="0.5"
              value={overtimeHours}
              onChange={handleOvertimeChange}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            Save Attendance
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AttendanceTab() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("ALL");
  const [editAttendanceModal, setEditAttendanceModal] = useState<any | null>(
    null,
  );

  useEffect(() => {
    fetchAttendancesAndEmployees();
  }, [attendanceDate]);

  const fetchAttendancesAndEmployees = async () => {
    setIsLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        getAttendancesByDate(attendanceDate),
        getEmployees(1, 100),
      ]);
      if (attRes.success && attRes.attendances) {
        setAttendances(attRes.attendances);
      }
      if (empRes.success && empRes.employees) {
        setEmployees(empRes.employees);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formattedAttendances = useMemo(() => {
    return employees.map((emp) => {
      const att = attendances.find((a) => a.userId === emp.id);

      const formatTime = (timeStr?: string) => {
        if (!timeStr) return "-";
        const d = new Date(timeStr);
        return d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return {
        id: emp.id,
        employeeName: emp.fullName || "N/A",
        role: emp.role,
        status: att ? att.status : "NOT MARKED",
        checkIn: att?.checkIn ? formatTime(att.checkIn) : "-",
        checkOut: att?.checkOut ? formatTime(att.checkOut) : "-",
        overtimeHours:
          att && att.overtimeHours !== null && att.overtimeHours !== undefined
            ? `${att.overtimeHours} hrs`
            : "0 hrs",
        originalAttendance: att,
      };
    });
  }, [employees, attendances]);

  const filteredAttendances = useMemo(() => {
    return formattedAttendances.filter((a) => {
      const matchesStatus =
        attendanceStatusFilter === "ALL" || a.status === attendanceStatusFilter;
      return matchesStatus;
    });
  }, [formattedAttendances, attendanceStatusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <ActivityFilters
        selectFilters={[
          {
            id: "attendanceStatus",
            label: "Attendance Status",
            value: attendanceStatusFilter,
            options: [
              { value: "ALL", label: "All Statuses" },
              { value: "PRESENT", label: "Present" },
              { value: "ABSENT", label: "Absent" },
              { value: "LATE", label: "Late" },
              { value: "HALF_DAY", label: "Half Day" },
              { value: "NOT MARKED", label: "Not Marked" },
            ],
            onChange: setAttendanceStatusFilter,
          },
        ]}
      >
        <div>
          <Input
            label="Attendance Date"
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </div>
      </ActivityFilters>

      <DataTable
        heading={`Attendance for ${attendanceDate}`}
        TableHeaders={attendanceHeaders}
        TableData={filteredAttendances}
        currentPage={1}
        totalPages={1}
        totalEntries={filteredAttendances.length}
        isLoading={isLoading}
        onPageChange={() => {}}
        TableButtons={[
          {
            icon: <Edit size={16} className="text-white" />,
            text: "Mark / Edit Attendance",
            className: "bg-[var(--color-primary)] hover:opacity-90 ",
            onClick: (row) => setEditAttendanceModal(row),
          },
        ]}
      />

      {editAttendanceModal && (
        <EditAttendanceFormModal
          modalData={editAttendanceModal}
          attendanceDate={attendanceDate}
          onClose={() => setEditAttendanceModal(null)}
          onSave={() => {
            setEditAttendanceModal(null);
            fetchAttendancesAndEmployees();
          }}
        />
      )}
    </div>
  );
}
