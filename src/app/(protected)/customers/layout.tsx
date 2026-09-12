import { getCurrentUser } from "@/actions/auth";
import { Sidebar } from "@/components/layouts";
import { Clock, Shield, ShoppingCart, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "CASHIER"))
    redirect("/auth/login");
  const items =
    user?.role === "ADMIN"
      ? [
          {
            label: "Customers",
            href: "/customers",
            icon: <Users size={18} />,
            exact: true,
          },
          {
            label: "Admin Portal",
            href: "/admin/dashboard",
            icon: <Shield size={18} />,
            exact: true,
          },
          {
            label: "POS Terminal",
            href: "/pos",
            icon: <ShoppingCart size={18} />,
            exact: true,
          },
        ]
      : [
          {
            label: "Customers",
            href: "/customers",
            icon: <Users size={18} />,
            exact: true,
          },
          {
            label: "POS Terminal",
            href: "/pos",
            icon: <ShoppingCart size={18} />,
            exact: true,
          },
          {
            label: "Live Orders",
            href: "/pos/live",
            icon: <Clock size={18} />,
            exact: true,
          },
        ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={items}
        brandName="RMS"
        brandTier={user?.role === "ADMIN" ? "Admin" : "Cashier POS"}
        user={user}
      />
      <main className="flex-1 overflow-y-auto scrollbar-none pt-14 md:pt-0 pb-10 md:pb-0 md:pl-14">
        <div className="max-w-400 mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
