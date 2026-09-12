import { requireAdmin } from "@/lib/authorization";
import { Sidebar } from "@/components/layouts";
import {
  LayoutDashboard,
  Utensils,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  ShoppingCart,
  Banknote,
  ClipboardList,
} from "lucide-react";

const adminNavItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Menu Management",
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
    label: "Payroll & Attendance",
    href: "/admin/payroll",
    icon: <Banknote size={18} />,
  },
  {
    label: "Reports & Analytics",
    href: "/admin/reports",
    icon: <BarChart3 size={18} />,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: <Users size={18} />,
  },
  {
    label: "POS Terminal",
    href: "/pos",
    icon: <ShoppingCart size={18} />,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={adminNavItems}
        brandName="RMS"
        brandTier="Admin"
        user={user}
      />

      <main className="flex-1 overflow-y-auto scrollbar-none pt-14 md:pt-0 pb-10 md:pb-0 md:pl-14">
        <div className="max-w-400 mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
