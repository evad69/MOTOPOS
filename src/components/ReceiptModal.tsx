"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Sale, SaleItem } from "@/database/db";
import { getSaleById, getSaleItems } from "@/database/sales";
import { RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDisplayDate, formatTime } from "@/utils/formatDate";

interface ReceiptModalProps {
  saleId: string | null;
  isVisible: boolean;
  onClose: () => void;
}

interface ReceiptDataState {
  sale: Sale;
  saleItems: SaleItem[];
}

/** Converts a stored payment method value into a human-readable receipt label. */
function formatPaymentMethodLabel(paymentMethod: string): string {
  if (paymentMethod === "gcash") {
    return "GCash";
  }

  if (paymentMethod === "maya") {
    return "Maya";
  }

  return "Cash";
}

/** Loads the saved receipt data for the selected completed sale. */
function useReceiptData(saleId: string | null, isVisible: boolean) {
  const [receiptData, setReceiptData] = useState<ReceiptDataState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId || !isVisible) {
      return;
    }

    let isCancelled = false;
    const currentSaleId = saleId;

    async function loadReceiptData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const sale = await getSaleById(currentSaleId);
        const saleItems = await getSaleItems(currentSaleId);
        if (!sale) {
          throw new Error("Receipt data could not be found.");
        }

        if (!isCancelled) {
          setReceiptData({ sale, saleItems });
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load receipt.");
          setReceiptData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReceiptData();
    return () => {
      isCancelled = true;
    };
  }, [isVisible, saleId]);

  return { receiptData, isLoading, errorMessage };
}

/** Renders the receipt line items and totals for a completed sale. */
function ReceiptBody({ sale, saleItems }: ReceiptDataState) {
  return (
    <div className="flex flex-col" style={{ gap: SPACING.lg }}>
      <div className="grid grid-cols-2" style={{ gap: SPACING.md }}>
        <div>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
            Date
          </p>
          <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
            {formatDisplayDate(sale.sale_date)}
          </p>
        </div>
        <div>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
            Time
          </p>
          <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
            {formatTime(sale.sale_date)}
          </p>
        </div>
        <div>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
            Payment Method
          </p>
          <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
            {formatPaymentMethodLabel(sale.payment_method)}
          </p>
        </div>
        <div>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
            Receipt ID
          </p>
          <p className="text-text-primary" style={{ fontSize: fontSizes.body }}>
            {sale.id}
          </p>
        </div>
      </div>
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
          <span>Price</span>
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
      <div className="flex items-center justify-between" style={{ gap: SPACING.md }}>
        <span className="text-text-secondary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.medium }}>
          Total
        </span>
        <span className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
          {formatCurrency(sale.total_amount)}
        </span>
      </div>
    </div>
  );
}

/** Renders the post-checkout receipt modal with print and close actions. */
export function ReceiptModal({ saleId, isVisible, onClose }: ReceiptModalProps) {
  const { receiptData, isLoading, errorMessage } = useReceiptData(saleId, isVisible);

  if (!isVisible || !saleId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      data-receipt-overlay="true"
      style={{ padding: SPACING.xl }}
    >
      <div className="w-full max-w-3xl" data-receipt-print="true">
        <Card style={{ backgroundColor: "var(--bg-primary)" }}>
          <div className="flex flex-col" style={{ gap: SPACING.lg }}>
            <div>
              <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
                Sale Complete
              </p>
              <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
                Receipt ready for review or printing.
              </p>
            </div>
            {isLoading ? <p>Loading receipt...</p> : null}
            {errorMessage ? <p className="text-danger">{errorMessage}</p> : null}
            {receiptData ? <ReceiptBody sale={receiptData.sale} saleItems={receiptData.saleItems} /> : null}
            <div
              className="flex justify-end"
              data-receipt-actions="true"
              style={{ gap: SPACING.md }}
            >
              <Button onClick={onClose} variant="secondary">
                Done
              </Button>
              <Button onClick={() => window.print()} variant="navy">
                Print
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
