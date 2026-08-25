"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  exact?: boolean;
}

export interface SidebarProps {
  brandName?: string;
  brandTier?: string;
  items: NavItem[];
  primaryAction?: { label: string; href: string; icon: ReactNode };
  onLogout?: () => void;
}

// --- Shared, reusable nav list ---
function NavLinks({
  items,
  isActive,
  variant,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (href: string, exact?: boolean) => boolean;
  variant: "drawer" | "desktop-collapsed" | "desktop-expanded";
  onNavigate?: () => void;
}) {
  const expanded = variant === "desktop-expanded";
  const isDesktop = variant !== "drawer";

  return (
    <>
      {items.map(({ label, href, icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center rounded-lg transition-all duration-200",
              isDesktop
                ? "flex-row justify-start w-full px-3 py-2.5 text-[clamp(0.875rem,1vw,0.95rem)] font-medium capitalize"
                : "gap-2.5 w-full px-3 py-2.5 text-[0.9rem] font-medium",
              active
                ? "text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-gray-500 group-hover:text-gray-900",
              )}
            >
              {icon}
            </span>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap",
                isDesktop &&
                  "transition-[max-width,opacity,margin] duration-300 ease-in-out",
                isDesktop && !expanded
                  ? "max-w-0 opacity-0 ml-0"
                  : "max-w-[180px] opacity-100 ml-2.5",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({
  brandName = "",
  brandTier = "",
  items,
}: SidebarProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* MOBILE / TABLET — top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 bg-white border-b border-gray-200/80">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <Menu size={22} />
        </button>
        <p className="ml-3 text-sm font-bold text-gray-900 truncate">
          {brandName}
        </p>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 bottom-0 z-50 w-[clamp(15rem,70vw,18rem)]",
          "bg-white border-r border-gray-200/80 flex flex-col overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200/50 shrink-0">
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">
              {brandName}
            </p>
            {brandTier && (
              <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest truncate">
                {brandTier}
              </p>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          <NavLinks
            items={items}
            isActive={isActive}
            variant="drawer"
            onNavigate={() => setMobileOpen(false)}
          />
        </nav>
      </aside>

      {/* DESKTOP */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:h-screen md:z-50",
          "md:bg-white md:border-r md:border-gray-200/80 md:flex-col md:overflow-hidden",
          "md:transition-[width] md:duration-300 md:ease-in-out",
          hovered ? "md:w-[clamp(14rem,18vw,18rem)]" : "md:w-16",
        )}
      >
        <div className="flex items-center h-16 border-b border-gray-200/50 overflow-hidden shrink-0">
          <div
            className={cn(
              "flex items-center gap-3 px-4 transition-opacity duration-200 whitespace-nowrap",
              hovered ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <div className="min-w-0">
              <p className="text-[clamp(1rem,1.25vw,1.125rem)] font-bold text-gray-900 truncate">
                {brandName}
              </p>
              {brandTier && (
                <p className="text-[0.65rem] text-gray-400 uppercase tracking-widest truncate">
                  {brandTier}
                </p>
              )}
            </div>
          </div>
        </div>
        <nav className="flex flex-col flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5 px-2">
          <NavLinks
            items={items}
            isActive={isActive}
            variant={hovered ? "desktop-expanded" : "desktop-collapsed"}
          />
        </nav>
      </aside>
    </>
  );
}
