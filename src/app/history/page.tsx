"use client";

import { useEffect, useState } from "react";
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { useAppContext } from "@/context/AppContext";
import { getSaleItems, getSalesByDateRange } from "@/database/sales";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDisplayDate, formatTime } from "@/utils/formatDate";

type HistoryFilterPreset = "today" | "this-week" | "this-month" | "custom";

interface HistorySaleRow {
  saleId: string;
  amountLabel: string;
  itemCountLabel: string;
  dateTimeLabel: string;
  paymentMethodLabel: string;
}

interface HistoryDateRange {
  startDate: string;
  endDate: string;
}

interface HistorySalesData {
  salesRows: HistorySaleRow[];
  totalRevenueLabel: string;
}

/** Returns today's date in the HTML date-input format. */
function getTodayDateValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Converts a stored payment method value into a readable label for history rows. */
function formatPaymentMethodLabel(paymentMethod: string): string {
  if (paymentMethod === "gcash") {
    return "GCash";
  }

  if (paymentMethod === "maya") {
    return "Maya";
  }

  return "Cash";
}

/** Resolves the active date range from the selected preset and custom dates. */
function getDateRange(
  filterPreset: HistoryFilterPreset,
  customStartDate: string,
  customEndDate: string,
): HistoryDateRange {
  const currentDate = new Date();

  if (filterPreset === "this-week") {
    return {
      startDate: format(startOfWeek(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfWeek(currentDate), "yyyy-MM-dd"),
    };
  }

  if (filterPreset === "this-month") {
    return {
      startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    };
  }

  if (filterPreset === "custom") {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }

  const todayDateValue = getTodayDateValue();
  return {
    startDate: todayDateValue,
    endDate: todayDateValue,
  };
}

/** Loads the sale history rows and period revenue summary for the active filter. */
function useHistorySales(
  filterPreset: HistoryFilterPreset,
  customStartDate: string,
  customEndDate: string,
  syncRefreshKey: number,
) {
  const [historySalesData, setHistorySalesData] = useState<HistorySalesData>({
    salesRows: [],
    totalRevenueLabel: formatCurrency(0),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeDateRange = getDateRange(filterPreset, customStartDate, customEndDate);

  useEffect(() => {
    let isCancelled = false;

    async function loadHistorySales() {
      setErrorMessage(null);

      try {
        const sales = await getSalesByDateRange(activeDateRange.startDate, activeDateRange.endDate);
        const salesRows = await Promise.all(
          sales.map(async (sale) => {
            const saleItems = await getSaleItems(sale.id);
            const totalItemCount = saleItems.reduce((sum, saleItem) => {
              return sum + saleItem.quantity;
            }, 0);

            return {
              saleId: sale.id,
              amountLabel: formatCurrency(sale.total_amount),
              itemCountLabel: `${totalItemCount} item${totalItemCount === 1 ? "" : "s"}`,
              dateTimeLabel: `${formatDisplayDate(sale.sale_date)} • ${formatTime(sale.sale_date)}`,
              paymentMethodLabel: formatPaymentMethodLabel(sale.payment_method),
            };
          }),
        );

        if (!isCancelled) {
          setHistorySalesData({
            salesRows,
            totalRevenueLabel: formatCurrency(
              sales.reduce((sum, sale) => sum + sale.total_amount, 0),
            ),
          });
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load sale history right now.");
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadHistorySales();
      }
    }

    void loadHistorySales();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeDateRange.endDate, activeDateRange.startDate, syncRefreshKey]);

  return { historySalesData, errorMessage };
}

/** Renders one selectable date-range filter button for the history page. */
function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      style={{
        minHeight: LAYOUT.minClickTarget,
        borderRadius: RADIUS.md,
        paddingInline: SPACING.md,
        paddingBlock: SPACING.sm,
        backgroundColor: isActive ? "var(--accent-navy)" : "var(--bg-secondary)",
        color: isActive ? "var(--text-on-accent)" : "var(--text-primary)",
        border: "1px solid var(--border)",
        fontSize: fontSizes.body,
        fontWeight: isActive ? fontWeights.semibold : fontWeights.medium,
      }}
      type="button"
    >
      {label}
    </button>
  );
}

/** Renders one HTML date input used by the custom history filter range. */
function DateFilterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-text-secondary" style={{ marginBottom: SPACING.xs, fontSize: fontSizes.caption }}>
        {label}
      </span>
      <input
        className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: LAYOUT.minClickTarget,
          borderRadius: RADIUS.md,
          paddingInline: SPACING.md,
          paddingBlock: SPACING.sm,
          fontSize: fontSizes.body,
        }}
        type="date"
        value={value}
      />
    </label>
  );
}

/** Renders the filtered history sales table with clickable rows. */
function HistorySalesTable({
  salesRows,
  errorMessage,
  onSelectSale,
}: {
  salesRows: HistorySaleRow[];
  errorMessage: string | null;
  onSelectSale: (saleId: string) => void;
}) {
  if (errorMessage) {
    return <Card>{errorMessage}</Card>;
  }

  if (!salesRows.length) {
    return <Card>No sales matched the selected date range.</Card>;
  }

  return (
    <Card>
      <div
        className="grid text-text-secondary"
        style={{
          gap: SPACING.md,
          gridTemplateColumns: "1fr 1fr 1.2fr 1fr",
          paddingBottom: SPACING.sm,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.semibold,
        }}
      >
        <span>Total Amount</span>
        <span>Item Count</span>
        <span>Date / Time</span>
        <span>Payment Method</span>
      </div>
      <div style={{ marginTop: SPACING.sm }}>
        {salesRows.map((salesRow) => (
          <button
            className="grid w-full border-0 bg-transparent text-left text-text-primary transition-colors duration-200 hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            key={salesRow.saleId}
            onClick={() => onSelectSale(salesRow.saleId)}
            style={{
              gap: SPACING.md,
              gridTemplateColumns: "1fr 1fr 1.2fr 1fr",
              minHeight: LAYOUT.minClickTarget,
              borderRadius: RADIUS.md,
              paddingInline: SPACING.md,
              paddingBlock: SPACING.md,
            }}
            type="button"
          >
            <span>{salesRow.amountLabel}</span>
            <span className="text-text-secondary">{salesRow.itemCountLabel}</span>
            <span>{salesRow.dateTimeLabel}</span>
            <span className="text-text-secondary">{salesRow.paymentMethodLabel}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Renders the sale history page with date filters, revenue summary, and sales table. */
export default function HistoryPage() {
  const router = useRouter();
  const { lastSyncedAt } = useAppContext();
  const [filterPreset, setFilterPreset] = useState<HistoryFilterPreset>("today");
  const [customStartDate, setCustomStartDate] = useState(getTodayDateValue());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateValue());
  const syncRefreshKey = lastSyncedAt?.getTime() ?? 0;
  const { historySalesData, errorMessage } = useHistorySales(
    filterPreset,
    customStartDate,
    customEndDate,
    syncRefreshKey,
  );

  return (
    <>
      <TopBar title="Sale History" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div className="flex flex-col" style={{ gap: SPACING.lg }}>
          <div>
            <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.semibold }}>
              Sale History
            </p>
            <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
              Browse completed sales and filter by the period you want to review.
            </p>
          </div>
          <Card>
            <div className="flex flex-col" style={{ gap: SPACING.lg }}>
              <div className="flex flex-wrap" style={{ gap: SPACING.sm }}>
                <FilterButton
                  isActive={filterPreset === "today"}
                  label="Today"
                  onClick={() => setFilterPreset("today")}
                />
                <FilterButton
                  isActive={filterPreset === "this-week"}
                  label="This Week"
                  onClick={() => setFilterPreset("this-week")}
                />
                <FilterButton
                  isActive={filterPreset === "this-month"}
                  label="This Month"
                  onClick={() => setFilterPreset("this-month")}
                />
                <FilterButton
                  isActive={filterPreset === "custom"}
                  label="Custom"
                  onClick={() => setFilterPreset("custom")}
                />
              </div>
              {filterPreset === "custom" ? (
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: SPACING.md }}>
                  <DateFilterField
                    label="Start Date"
                    onChange={setCustomStartDate}
                    value={customStartDate}
                  />
                  <DateFilterField
                    label="End Date"
                    onChange={setCustomEndDate}
                    value={customEndDate}
                  />
                </div>
              ) : null}
            </div>
          </Card>
          <Card>
            <div className="flex items-end justify-between" style={{ gap: SPACING.md }}>
              <div>
                <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                  Selected Period Revenue
                </p>
                <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
                  {historySalesData.totalRevenueLabel}
                </p>
              </div>
            </div>
          </Card>
          <HistorySalesTable
            errorMessage={errorMessage}
            onSelectSale={(saleId) => router.push(`/history/${saleId}`)}
            salesRows={historySalesData.salesRows}
          />
        </div>
      </div>
    </>
  );
}
