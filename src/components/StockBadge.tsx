import { RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface StockBadgeProps {
  stockQty: number;
  lowStockThreshold: number;
}

/** Returns the color values used by the stock badge state. */
function getStockBadgeColors(isLowStock: boolean) {
  if (isLowStock) {
    return {
      backgroundColor: "var(--stock-low-bg)",
      color: "var(--stock-low-text)",
    };
  }

  return {
    backgroundColor: "var(--stock-ok-bg)",
    color: "var(--stock-ok-text)",
  };
}

/** Formats the text value displayed inside the stock badge. */
function stockQtyLabel(stockQty: number): string {
  return `${stockQty} pcs`;
}

/** Renders a color-coded stock badge with both status and quantity text. */
export function StockBadge({ stockQty, lowStockThreshold }: StockBadgeProps) {
  const isLowStock = stockQty <= lowStockThreshold;
  const colorValues = getStockBadgeColors(isLowStock);
  const badgeLabel = isLowStock
    ? `Low Stock: ${stockQtyLabel(stockQty)}`
    : `In Stock: ${stockQtyLabel(stockQty)}`;

  return (
    <span
      className="inline-flex items-center justify-center"
      role="status"
      style={{
        backgroundColor: colorValues.backgroundColor,
        color: colorValues.color,
        borderRadius: RADIUS.full,
        paddingInline: SPACING.md,
        paddingBlock: SPACING.xs,
        fontSize: fontSizes.caption,
        fontWeight: fontWeights.semibold,
      }}
    >
      {badgeLabel}
    </span>
  );
}
