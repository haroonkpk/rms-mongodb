"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layouts";
import { LayoutDashboard, UtensilsCrossed, ShieldAlert } from "lucide-react";

const mainNavItems = [
  {
    label: "POS",
    href: "/pos",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
  {
    label: "Kitchen",
    href: "/kitchen",
    icon: <UtensilsCrossed size={18} />,
    exact: true,
  },
  {
    label: "Admin",
    href: "/admin/dashboard",
    icon: <ShieldAlert size={18} />,
  },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={mainNavItems} brandName="RMS" brandTier="POS" />
      <div className="max-w-400 mx-auto w-full">
        {children}
      </div>
    </div>
  );
}
