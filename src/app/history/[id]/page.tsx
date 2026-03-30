"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { Sale, SaleItem } from "@/database/db";
import { getRecentSales, getSaleItems } from "@/database/sales";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDisplayDate, formatTime } from "@/utils/formatDate";

interface SaleDetailState {
  sale: Sale;
  saleItems: SaleItem[];
}

/** Converts a stored payment method value into a readable sale-detail label. */
function formatPaymentMethodLabel(paymentMethod: string): string {
  if (paymentMethod === "gcash") {
    return "GCash";
  }

  if (paymentMethod === "maya") {
    return "Maya";
  }

  return "Cash";
}

/** Loads the selected sale record and its line items for the detail page. */
function useSaleDetail(saleId: string) {
  const [saleDetailState, setSaleDetailState] = useState<SaleDetailState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadSaleDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const recentSales = await getRecentSales(1000);
        const selectedSale = recentSales.find((sale) => sale.id === saleId);
        if (!selectedSale) {
          throw new Error("Sale not found.");
        }

        const saleItems = await getSaleItems(saleId);
        if (!isCancelled) {
          setSaleDetailState({ sale: selectedSale, saleItems });
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load sale detail.");
          setSaleDetailState(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSaleDetail();
    return () => {
      isCancelled = true;
    };
  }, [saleId]);

  return { saleDetailState, errorMessage, isLoading };
}

/** Renders the itemized receipt table shown on the sale detail page. */
function SaleDetailTable({ saleItems }: { saleItems: SaleItem[] }) {
  return (
    <div className="border border-[var(--border)]" style={{ borderRadius: RADIUS.md }}>
      <div
        className="grid text-text-secondary"
        style={{
          gridTemplateColumns: "minmax(0, 1.8fr) auto auto auto",
          gap: SPACING.md,
          padding: SPACING.md,
          borderBottom: "1px solid var(--border)",
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.semibold,
        }}
      >
        <span>Item</span>
        <span>Qty</span>
        <span>Unit Price</span>
        <span>Subtotal</span>
      </div>
      <div className="flex flex-col">
        {saleItems.map((saleItem) => (
          <div
            className="grid text-text-primary"
            key={saleItem.id}
            style={{
              gridTemplateColumns: "minmax(0, 1.8fr) auto auto auto",
              gap: SPACING.md,
              padding: SPACING.md,
              borderBottom: "1px solid var(--divider)",
              fontSize: fontSizes.body,
            }}
          >
            <span>{saleItem.product_name}</span>
            <span>{saleItem.quantity}</span>
            <span>{formatCurrency(saleItem.unit_price)}</span>
            <span>{formatCurrency(saleItem.subtotal)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Renders the sale detail page with receipt data and print/back actions. */
export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { saleDetailState, errorMessage, isLoading } = useSaleDetail(saleId);

  return (
    <>
      <TopBar title="Sale Detail" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div className="flex flex-col" style={{ gap: SPACING.lg }}>
          <div data-receipt-actions="true">
            <Link
              className="inline-flex items-center text-text-secondary transition-opacity duration-200 hover:opacity-80"
              href="/history"
              style={{ fontSize: fontSizes.body, fontWeight: fontWeights.medium }}
            >
              ← Back
            </Link>
          </div>
          {isLoading ? <Card>Loading sale detail...</Card> : null}
          {!isLoading && errorMessage ? <Card>{errorMessage}</Card> : null}
          {!isLoading && saleDetailState ? (
            <div data-receipt-print="true">
              <Card style={{ backgroundColor: "var(--bg-primary)" }}>
                <div className="flex flex-col" style={{ gap: SPACING.lg }}>
                  <div>
                    <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
                      Sale Receipt
                    </p>
                    <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
                      Review the full itemized sale detail below.
                    </p>
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: SPACING.md }}>
                    <div>
                      <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                        Date
                      </p>
                      <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
                        {formatDisplayDate(saleDetailState.sale.sale_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                        Time
                      </p>
                      <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
                        {formatTime(saleDetailState.sale.sale_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                        Payment Method
                      </p>
                      <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
                        {formatPaymentMethodLabel(saleDetailState.sale.payment_method)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
                        Receipt ID
                      </p>
                      <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
                        {saleDetailState.sale.id}
                      </p>
                    </div>
                  </div>
                  <SaleDetailTable saleItems={saleDetailState.saleItems} />
                  <div className="flex items-center justify-between" style={{ gap: SPACING.md }}>
                    <span className="text-text-secondary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.medium }}>
                      Total
                    </span>
                    <span className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
                      {formatCurrency(saleDetailState.sale.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-end" data-receipt-actions="true" style={{ gap: SPACING.md }}>
                    <Button onClick={() => window.print()} variant="navy">
                      Print Receipt
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
