"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  ShoppingCart,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
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
    paddingInline: isMobile ? SPACING.lg : undefined,
    paddingBlock: isMobile ? SPACING.sm : undefined,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  };
}

/** Returns the shared classes used by desktop and mobile navigation links. */
function getNavigationLinkClassName(isActive: boolean, isMobile = false): string {
  return [
    "flex w-full items-center transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-accent-navy",
    isMobile
      ? "justify-start gap-3 text-white/80 hover:bg-white/8 hover:text-white"
      : "justify-center gap-0 px-0 py-2 text-white/60 hover:bg-white/5 hover:text-white md:group-hover:justify-start md:group-hover:gap-3 md:group-hover:px-3",
    isActive ? "bg-white/10 text-white" : undefined,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Renders the persistent navigation sidebar used across the app shell. */
export function Sidebar() {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { isMobileNavOpen, closeMobileNav } = useAppContext();
  const { signOut, user } = useAuth();
  const previousPathnameRef = useRef(pathname);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Unable to sign out.", error);
    } finally {
      setIsSigningOut(false);
    }
  }

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
        className="group hidden md:flex md:w-[var(--sidebar-collapsed-width)] md:flex-col md:bg-accent-navy md:transition-[width] md:duration-200 md:hover:w-[var(--sidebar-width)] md:overflow-hidden"
        style={getSidebarStyle()}
      >
        <div className="border-b border-white/10 px-3 py-4 text-white">
          <div className="flex items-center justify-center md:group-hover:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/10 text-sm font-semibold">
              M
            </div>
          </div>
          <div className="hidden md:group-hover:block md:transition-opacity md:duration-200">
            <div className="truncate text-sm font-semibold">MotoPOS</div>
            <div className="mt-1 text-xs text-white/60">MotorParts POS</div>
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
                <span className="hidden md:inline md:max-w-0 md:translate-x-2 md:opacity-0 md:overflow-hidden md:transition-all md:duration-200 md:group-hover:max-w-[160px] md:group-hover:translate-x-0 md:group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-2">
          <div className="hidden px-3 pb-3 text-xs md:block md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200">
            <div className="truncate font-medium text-white/80">{user?.email ?? "Signed in"}</div>
            <div className="mt-1 text-white/45">Protected shop session</div>
          </div>
          <button
            className="flex w-full items-center justify-center gap-0 rounded-[10px] px-0 py-3 text-left text-white/70 transition-all duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60 md:group-hover:justify-start md:group-hover:gap-3 md:group-hover:px-3"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            <span className="hidden md:inline md:max-w-0 md:translate-x-2 md:opacity-0 md:overflow-hidden md:transition-all md:duration-200 md:group-hover:max-w-[160px] md:group-hover:translate-x-0 md:group-hover:opacity-100">
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </span>
          </button>
        </div>
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
          <div className="border-t border-white/10 p-3">
            <div className="mb-3 text-xs text-white/55">
              <div className="truncate font-medium text-white/80">{user?.email ?? "Signed in"}</div>
              <div className="mt-1">Protected shop session</div>
            </div>
            <button
              className="flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-4 text-left text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
