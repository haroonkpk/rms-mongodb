import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Clock, DollarSign, Calendar } from "lucide-react";
import { EmployeeData } from "@/actions/employees";

export interface UserProfileData {
  id?: string;
  email: string;
  fullName?: string | null;
  role: string;
  status?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  shiftTiming?: string | null;
  monthlyBaseSalary?: number | string | null;
  createdAt?: Date | string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: UserProfileData | null;
  onEdit?: (employee: EmployeeData) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  employee,
  onEdit,
}: UserProfileModalProps) {
  if (!employee) return null;

  const employeeDetails = [
    {
      icon: Mail,
      label: "Email Address",
      value: employee.email,
      breakAll: true,
    },
    {
      icon: Phone,
      label: "Phone Number",
      value: employee.phone || "Not Provided",
    },
    {
      icon: Clock,
      label: "Shift Schedule",
      value: employee.shiftTiming
        ? employee.shiftTiming.replace("_", " ")
        : "Unassigned",
    },
    {
      icon: DollarSign,
      label: "Monthly Base Salary",
      value:
        employee.monthlyBaseSalary !== null
          ? `Rs ${employee.monthlyBaseSalary?.toLocaleString()}`
          : "Not Specified",
    },
    {
      icon: Calendar,
      label: "Hired Date",
      value: employee.createdAt
        ? new Date(employee.createdAt).toLocaleDateString()
        : "N/A",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Profile Information"
      className="max-w-xl"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Top Info Banner */}
        <div className="flex items-center gap-[clamp(0.5rem,2vw,1rem)] p-[clamp(0.75rem,3vw,1rem)] bg-[var(--color-page-bg)]">
          <div className="w-[clamp(3rem,12vw,4.5rem)] h-[clamp(3rem,12vw,4.5rem)] rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {employee.avatarUrl ? (
              <img
                src={employee.avatarUrl}
                alt={employee.fullName || "User Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User
                size={32}
                className="text-[var(--color-primary)] w-[clamp(1.25rem,5vw,2rem)] h-[clamp(1.25rem,5vw,2rem)]"
              />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-[clamp(0.9rem,4vw,1.25rem)] font-bold text-slate-900 truncate">
              {employee.fullName || "Unnamed Staff"}
            </h4>
            <p className="text-[clamp(0.6rem,2.5vw,0.75rem)] font-semibold text-slate-500 uppercase tracking-wider truncate">
              {employee.email}
            </p>
            <div className="flex items-center gap-[clamp(0.25rem,1.5vw,0.5rem)] mt-1.5 flex-wrap">
              <span className="px-[clamp(0.4rem,1.5vw,0.5rem)] py-0.5 rounded-full text-[clamp(0.55rem,2vw,0.75rem)] font-bold uppercase tracking-wide bg-slate-900 text-white whitespace-nowrap">
                {employee.role}
              </span>
              {employee.status && (
                <span
                  className={`px-[clamp(0.4rem,1.5vw,0.5rem)] py-0.5 rounded-full text-[clamp(0.55rem,2vw,0.75rem)] font-bold uppercase tracking-wide whitespace-nowrap ${
                    employee.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : employee.status === "ON_LEAVE"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {employee.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Grid Information Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {employeeDetails.map(({ icon: Icon, label, value, breakAll }) => (
            <div
              key={label}
              className="flex items-start gap-3 p-3  border border-slate-100 bg-slate-50/50"
            >
              <Icon size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  {label}
                </p>
                <p
                  className={`font-medium text-slate-800 ${
                    breakAll ? "break-all" : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions -  */}
        {onEdit && (
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit(employee as EmployeeData);
              }}
            >
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
