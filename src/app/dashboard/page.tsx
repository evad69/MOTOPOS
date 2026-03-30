"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { TopBar } from "@/components/TopBar";
import { getLowStockProducts } from "@/database/products";
import { getTodaySalesSummary, getTopSellingProducts } from "@/database/sales";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";

interface DashboardMetrics {
  todaysRevenue: string;
  todaysTransactions: string;
  lowStockCount: string;
  topItemName: string;
  lowStockProductNames: string[];
}

/** Returns the initial placeholder values shown before dashboard metrics finish loading. */
function createInitialMetrics(): DashboardMetrics {
  return {
    todaysRevenue: "—",
    todaysTransactions: "—",
    lowStockCount: "—",
    topItemName: "Loading...",
    lowStockProductNames: [],
  };
}

/** Loads the live dashboard metric values from IndexedDB. */
function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(createInitialMetrics());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadMetrics() {
      setErrorMessage(null);

      try {
        const [todaySummary, lowStockProducts, topSellingProducts] = await Promise.all([
          getTodaySalesSummary(),
          getLowStockProducts(),
          getTopSellingProducts(30, 1),
        ]);

        if (!isCancelled) {
          setMetrics({
            todaysRevenue: formatCurrency(todaySummary.totalAmount),
            todaysTransactions: String(todaySummary.transactionCount),
            lowStockCount: String(lowStockProducts.length),
            topItemName: topSellingProducts[0]?.name ?? "No sales yet",
            lowStockProductNames: lowStockProducts.map((product) => product.name),
          });
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load dashboard metrics right now.");
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadMetrics();
      }
    }

    void loadMetrics();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { metrics, errorMessage };
}

/** Renders the dashboard warning banner for products that need restocking attention. */
function LowStockAlertBanner({ lowStockProductNames }: { lowStockProductNames: string[] }) {
  if (!lowStockProductNames.length) {
    return null;
  }

  return (
    <Link
      className="block border border-warning bg-warning text-accent-navy transition-opacity duration-200 hover:opacity-90"
      href="/inventory?tab=low-stock"
      style={{ borderRadius: RADIUS.lg, padding: SPACING.lg }}
    >
      <div className="flex flex-col" style={{ gap: SPACING.xs }}>
        <span style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.bold }}>
          Low Stock Alert
        </span>
        <span style={{ fontSize: fontSizes.body, fontWeight: fontWeights.medium }}>
          {lowStockProductNames.join(", ")}
        </span>
      </div>
    </Link>
  );
}

/** Renders the dashboard metric card grid using live IndexedDB summary data. */
export default function DashboardPage() {
  const { metrics, errorMessage } = useDashboardMetrics();

  return (
    <>
      <TopBar title="Dashboard" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div className="flex flex-col" style={{ gap: SPACING.lg }}>
          <div>
            <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.semibold }}>
              Business Snapshot
            </p>
            <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
              Live sales and inventory metrics from your offline-first store data.
            </p>
          </div>
          <LowStockAlertBanner lowStockProductNames={metrics.lowStockProductNames} />
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: SPACING.lg }}>
            <MetricCard label="Today's Revenue" value={metrics.todaysRevenue} />
            <MetricCard label="Transactions Today" value={metrics.todaysTransactions} />
            <MetricCard label="Low Stock Items" value={metrics.lowStockCount} />
            <MetricCard label="Top Item (30 Days)" value={metrics.topItemName} />
          </div>
          {errorMessage ? <Card>{errorMessage}</Card> : null}
        </div>
      </div>
    </>
  );
}
