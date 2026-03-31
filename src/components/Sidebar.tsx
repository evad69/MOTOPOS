"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingCart,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
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
  { href: "/history", label: "Sale History", icon: History },
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
function getSidebarLinkStyle(isMobile = false): CSSProperties {
  return {
    minHeight: LAYOUT.minClickTarget,
    borderRadius: RADIUS.md,
    paddingInline: isMobile ? SPACING.lg : SPACING.md,
    paddingBlock: SPACING.sm,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  };
}

/** Returns the shared classes used by desktop and mobile navigation links. */
function getNavigationLinkClassName(isActive: boolean, isMobile = false): string {
  return [
    "flex items-center gap-3 transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-accent-navy",
    isMobile
      ? "justify-start text-white/80 hover:bg-white/8 hover:text-white"
      : "justify-center text-white/60 hover:bg-white/5 hover:text-white lg:justify-start",
    isActive ? "bg-white/10 text-white" : undefined,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Renders the persistent navigation sidebar used across the app shell. */
export function Sidebar() {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useAppContext();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname && isMobileNavOpen) {
      closeMobileNav();
    }

    previousPathnameRef.current = pathname;
  }, [pathname, isMobileNavOpen, closeMobileNav]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    };
    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        closeMobileNav();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [isMobileNavOpen, closeMobileNav]);

  return (
    <>
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

            return (
              <Link
                key={item.href}
                aria-label={item.label}
                className={getNavigationLinkClassName(isActive)}
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

      <div
        aria-hidden={!isMobileNavOpen}
        className={[
          "fixed inset-0 z-40 md:hidden",
          isMobileNavOpen ? "pointer-events-auto" : "pointer-events-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          aria-label="Close navigation menu"
          className={[
            "absolute inset-0 bg-accent-navy/45 backdrop-blur-sm transition-opacity duration-200",
            isMobileNavOpen ? "opacity-100" : "opacity-0",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={closeMobileNav}
          type="button"
        />
        <aside
          className={[
            "absolute inset-y-0 left-0 flex w-[min(82vw,280px)] flex-col bg-accent-navy text-white shadow-2xl",
            "transition-transform duration-200",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
          ]
            .filter(Boolean)
            .join(" ")}
          style={getSidebarStyle()}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <div className="text-base font-semibold">MotoPOS</div>
              <div className="mt-1 text-xs text-white/60">MotorParts POS</div>
            </div>
            <button
              aria-label="Close navigation menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={closeMobileNav}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-2 p-3">
            {navigationItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  aria-label={item.label}
                  className={getNavigationLinkClassName(isActive, true)}
                  href={item.href}
                  onClick={closeMobileNav}
                  style={getSidebarLinkStyle(true)}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
