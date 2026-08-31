import { getCurrentUser } from "@/actions/auth";
import { Sidebar } from "@/components/layouts";
import { LayoutDashboard, UtensilsCrossed, ShieldAlert, Clock } from "lucide-react";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  let mainNavItems = [];
  let brandTier = "Staff";

  if (user?.role === "CHEF") {
    brandTier = "Chef KDS";
    mainNavItems = [
      {
        label: "Kitchen Display",
        href: "/kitchen",
        icon: <UtensilsCrossed size={18} />,
        exact: true,
      },
    ];
  } else if (user?.role === "CASHIER") {
    brandTier = "Cashier POS";
    mainNavItems = [
      {
        label: "POS Terminal",
        href: "/pos",
        icon: <LayoutDashboard size={18} />,
        exact: true,
      },
      {
        label: "Live Orders",
        href: "/pos/live",
        icon: <Clock size={18} />,
        exact: true,
      },
    ];
  } else {
    // ADMIN or default fallback: show all staff routes
    brandTier = "Staff Portal";
    mainNavItems = [
      {
        label: "POS Terminal",
        href: "/pos",
        icon: <LayoutDashboard size={18} />,
        exact: true,
      },
      {
        label: "Live Orders",
        href: "/pos/live",
        icon: <Clock size={18} />,
        exact: true,
      },
      {
        label: "Kitchen Display",
        href: "/kitchen",
        icon: <UtensilsCrossed size={18} />,
        exact: true,
      },
    ];
  }

  if (user?.role === "ADMIN") {
    mainNavItems.push({
      label: "Admin",
      href: "/admin/dashboard",
      icon: <ShieldAlert size={18} />,
      exact: true,
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={mainNavItems}
        brandName="RMS"
        brandTier={brandTier}
        user={user}
      />
      <main className="flex-1 overflow-y-auto scrollbar-none pt-14 md:pt-0 pb-10 md:pb-0 md:pl-14">
        <div className="max-w-400 mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
