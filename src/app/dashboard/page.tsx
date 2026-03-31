"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { TopBar } from "@/components/TopBar";
import { useAppContext } from "@/context/AppContext";
import { SaleItem } from "@/database/db";
import { getLowStockProducts } from "@/database/products";
import {
  getRecentSales,
  getSaleItems,
  getTodaySalesSummary,
  getTopSellingProducts,
} from "@/database/sales";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDisplayDate, formatTime } from "@/utils/formatDate";

interface DashboardMetrics {
  todaysRevenue: string;
  todaysTransactions: string;
  lowStockCount: string;
  topItemName: string;
  lowStockProductNames: string[];
}

interface RecentSaleRow {
  saleId: string;
  dateTimeLabel: string;
  itemsSummary: string;
  amountLabel: string;
  paymentMethodLabel: string;
}

/** Returns the initial placeholder values shown before dashboard metrics finish loading. */
function createInitialMetrics(): DashboardMetrics {
  return {
    todaysRevenue: "--",
    todaysTransactions: "--",
    lowStockCount: "--",
    topItemName: "Loading...",
    lowStockProductNames: [],
  };
}

/** Returns a readable payment method label for dashboard sale rows. */
function formatPaymentMethodLabel(paymentMethod: string): string {
  if (paymentMethod === "gcash") {
    return "GCash";
  }

  if (paymentMethod === "maya") {
    return "Maya";
  }

  return "Cash";
}

/** Condenses sale items into a compact one-line summary for the dashboard table. */
function summarizeSaleItems(saleItems: SaleItem[]): string {
  if (!saleItems.length) {
    return "No items";
  }

  const productNames = saleItems.map((saleItem) => saleItem.product_name);
  if (productNames.length <= 2) {
    return productNames.join(", ");
  }

  return `${productNames.slice(0, 2).join(", ")} +${productNames.length - 2} more`;
}

/** Loads the live dashboard metric values from IndexedDB. */
function useDashboardMetrics(syncRefreshKey: number) {
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
  }, [syncRefreshKey]);

  return { metrics, errorMessage };
}

/** Loads the recent sales rows shown in the dashboard table. */
function useRecentSalesRows(syncRefreshKey: number) {
  const [recentSalesRows, setRecentSalesRows] = useState<RecentSaleRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRecentSalesRows() {
      setErrorMessage(null);

      try {
        const recentSales = await getRecentSales(10);
        const saleRows = await Promise.all(
          recentSales.map(async (sale) => {
            const saleItems = await getSaleItems(sale.id);
            return {
              saleId: sale.id,
              dateTimeLabel: `${formatDisplayDate(sale.sale_date)} • ${formatTime(sale.sale_date)}`,
              itemsSummary: summarizeSaleItems(saleItems),
              amountLabel: formatCurrency(sale.total_amount),
              paymentMethodLabel: formatPaymentMethodLabel(sale.payment_method),
            };
          }),
        );

        if (!isCancelled) {
          setRecentSalesRows(saleRows);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load recent sales right now.");
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadRecentSalesRows();
      }
    }

    void loadRecentSalesRows();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncRefreshKey]);

  return { recentSalesRows, errorMessage };
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

/** Renders the dashboard table of recent sales with clickable history rows. */
function RecentSalesTable({
  recentSalesRows,
  errorMessage,
  onSelectSale,
}: {
  recentSalesRows: RecentSaleRow[];
  errorMessage: string | null;
  onSelectSale: (saleId: string) => void;
}) {
  if (errorMessage) {
    return <Card>{errorMessage}</Card>;
  }

  if (!recentSalesRows.length) {
    return <Card>No sales have been recorded yet.</Card>;
  }

  return (
    <Card>
      <div
        className="grid text-text-secondary"
        style={{
          gap: SPACING.md,
          gridTemplateColumns: "1.2fr 2fr 1fr 1fr",
          paddingBottom: SPACING.sm,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.semibold,
        }}
      >
        <span>Date / Time</span>
        <span>Items</span>
        <span>Amount</span>
        <span>Payment</span>
      </div>
      <div style={{ marginTop: SPACING.sm }}>
        {recentSalesRows.map((recentSaleRow) => (
          <button
            className="grid w-full border-0 bg-transparent text-left text-text-primary transition-colors duration-200 hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            key={recentSaleRow.saleId}
            onClick={() => onSelectSale(recentSaleRow.saleId)}
            style={{
              gap: SPACING.md,
              gridTemplateColumns: "1.2fr 2fr 1fr 1fr",
              minHeight: LAYOUT.minClickTarget,
              borderRadius: RADIUS.md,
              paddingInline: SPACING.md,
              paddingBlock: SPACING.md,
            }}
            type="button"
          >
            <span>{recentSaleRow.dateTimeLabel}</span>
            <span className="text-text-secondary">{recentSaleRow.itemsSummary}</span>
            <span>{recentSaleRow.amountLabel}</span>
            <span className="text-text-secondary">{recentSaleRow.paymentMethodLabel}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Renders the dashboard metrics, low-stock banner, and recent sales table. */
export default function DashboardPage() {
  const router = useRouter();
  const { lastSyncedAt } = useAppContext();
  const syncRefreshKey = lastSyncedAt?.getTime() ?? 0;
  const { metrics, errorMessage } = useDashboardMetrics(syncRefreshKey);
  const { recentSalesRows, errorMessage: recentSalesErrorMessage } = useRecentSalesRows(syncRefreshKey);

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
          <div className="flex flex-col" style={{ gap: SPACING.md }}>
            <div>
              <p className="text-text-primary" style={{ fontSize: fontSizes.title, fontWeight: fontWeights.semibold }}>
                Recent Sales
              </p>
              <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
                Latest 10 completed transactions from local IndexedDB.
              </p>
            </div>
            <RecentSalesTable
              errorMessage={recentSalesErrorMessage}
              onSelectSale={(saleId) => router.push(`/history/${saleId}`)}
              recentSalesRows={recentSalesRows}
            />
          </div>
          {errorMessage ? <Card>{errorMessage}</Card> : null}
        </div>
      </div>
    </>
  );
}
