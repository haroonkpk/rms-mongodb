import { Sidebar } from "@/components/layouts";
import {
  LayoutDashboard,
  Utensils,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Menu",
    href: "/admin/menu",
    icon: <Utensils size={18} />,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: <Boxes size={18} />,
  },
  {
    label: "Employees",
    href: "/admin/employees",
    icon: <Users size={18} />,
  },
  {
    label: "Expenses",
    href: "/admin/expenses",
    icon: <Receipt size={18} />,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Back to POS",
    href: "/pos",
    icon: <ArrowLeft size={18} />,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={adminNavItems} brandName="RMS" brandTier="Admin" />
      <div className="max-w-400 mx-auto w-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
