"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sale/new", label: "New Sale", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/ai", label: "AI Assistant", icon: MessageCircle },
];

/** Returns true when the current route belongs to a sidebar navigation item. */
function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Returns the shared responsive width styles for the sidebar shell. */
function getSidebarStyle(): CSSProperties {
  return {
    ["--sidebar-width" as string]: `${LAYOUT.sidebarWidth}px`,
    ["--sidebar-collapsed-width" as string]: `${LAYOUT.collapsedSidebarWidth}px`,
  };
}

/** Returns the inline sizing styles for a sidebar navigation link. */
function getSidebarLinkStyle(): CSSProperties {
  return {
    minHeight: LAYOUT.minClickTarget,
    borderRadius: RADIUS.md,
    paddingInline: SPACING.md,
    paddingBlock: SPACING.sm,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  };
}

/** Renders the persistent navigation sidebar used across the app shell. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex md:w-[var(--sidebar-collapsed-width)] md:flex-col md:bg-accent-navy lg:w-[var(--sidebar-width)]"
      style={getSidebarStyle()}
    >
      <div className="border-b border-white/10 px-3 py-4 text-white">
        <div className="truncate text-sm font-semibold lg:text-base">MotoPOS</div>
        <div className="mt-1 hidden text-xs text-white/60 lg:block">
          MotorParts POS
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-2">
        {navigationItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;
          const linkClasses = [
            "flex items-center justify-center gap-3 text-white/60 transition-colors duration-200",
            "hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-accent-navy",
            "lg:justify-start",
            isActive ? "bg-white/10 text-white" : undefined,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link
              key={item.href}
              aria-label={item.label}
              className={linkClasses}
              href={item.href}
              style={getSidebarLinkStyle()}
            >
              <Icon aria-hidden="true" size={18} />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
