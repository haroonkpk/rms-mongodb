import { Sidebar } from "@/components/layouts";
import { LayoutDashboard } from "lucide-react";

const ownerNavItems = [
  {
    label: "POS",
    href: "/pos",
    icon: <LayoutDashboard size={18} />,
    exact: true,
  },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen flex">
      <Sidebar items={ownerNavItems} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
