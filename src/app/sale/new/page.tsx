"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { useAppContext } from "@/context/AppContext";
import { Product } from "@/database/db";
import { getAllProducts, searchProducts } from "@/database/products";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";

interface ProductSearchToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

interface SaleProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

/** Returns a debounced copy of a value to reduce product re-query frequency. */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

/** Loads sellable products for the New Sale browser using the current search query. */
function useSaleProducts(searchQuery: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextProducts = searchQuery.trim().length
          ? await searchProducts(searchQuery)
          : await getAllProducts();

        if (!isCancelled) {
          setProducts(nextProducts);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load products right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      isCancelled = true;
    };
  }, [searchQuery]);

  return { products, isLoading, errorMessage };
}

/** Renders the search field and barcode scan stub for the New Sale page. */
function ProductSearchToolbar({
  searchQuery,
  onSearchChange,
}: ProductSearchToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row" style={{ gap: SPACING.md }}>
      <label className="block flex-1">
        <span className="sr-only">Search products for a new sale</span>
        <input
          className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by product name, brand, or SKU"
          style={{
            minHeight: LAYOUT.minClickTarget,
            borderRadius: RADIUS.md,
            paddingInline: SPACING.md,
            paddingBlock: SPACING.sm,
            fontSize: fontSizes.body,
          }}
          type="search"
          value={searchQuery}
        />
      </label>
      <Button disabled variant="secondary">
        Scan Barcode (Phase 11)
      </Button>
    </div>
  );
}

/** Renders the stock label shown on each product card in the sale browser. */
function ProductStockLabel({ stockQty }: { stockQty: number }) {
  if (stockQty === 0) {
    return (
      <span
        className="inline-flex items-center justify-center text-danger"
        style={{
          minHeight: LAYOUT.minClickTarget,
          borderRadius: RADIUS.full,
          paddingInline: SPACING.md,
          paddingBlock: SPACING.xs,
          fontSize: fontSizes.caption,
          fontWeight: fontWeights.semibold,
        }}
      >
        Out of stock
      </span>
    );
  }

  return (
    <span className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
      {stockQty} pcs in stock
    </span>
  );
}

/** Renders a product card with stock, price, and add-to-cart action. */
function SaleProductCard({ product, onAddToCart }: SaleProductCardProps) {
  const isOutOfStock = product.stock_qty === 0;

  return (
    <Card className="h-full">
      <div className="flex h-full flex-col justify-between" style={{ gap: SPACING.lg }}>
        <div className="flex flex-col" style={{ gap: SPACING.sm }}>
          <div className="flex items-start justify-between" style={{ gap: SPACING.md }}>
            <div>
              <p className="text-text-primary" style={{ fontSize: fontSizes.title, fontWeight: fontWeights.semibold }}>
                {product.name}
              </p>
              <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
                {product.brand || "No brand"}
              </p>
            </div>
            <span className="text-text-secondary" style={{ fontSize: fontSizes.caption }}>
              {product.sku}
            </span>
          </div>
          <div className="flex items-center justify-between" style={{ gap: SPACING.md }}>
            <ProductStockLabel stockQty={product.stock_qty} />
            <span className="text-text-primary" style={{ fontSize: fontSizes.price, fontWeight: fontWeights.semibold }}>
              {formatCurrency(product.selling_price)}
            </span>
          </div>
        </div>
        <Button disabled={isOutOfStock} onClick={() => onAddToCart(product)}>
          + Add
        </Button>
      </div>
    </Card>
  );
}

/** Renders the New Sale product browser with loading, error, and empty states. */
function ProductBrowserPanel({
  products,
  isLoading,
  errorMessage,
  onAddToCart,
}: {
  products: Product[];
  isLoading: boolean;
  errorMessage: string | null;
  onAddToCart: (product: Product) => void;
}) {
  if (isLoading) {
    return <Card>Loading available products...</Card>;
  }

  if (errorMessage) {
    return <Card>{errorMessage}</Card>;
  }

  if (!products.length) {
    return <Card>No products matched the current search.</Card>;
  }

  return (
    <div
      className="grid"
      style={{ gap: SPACING.lg, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
    >
      {products.map((product) => (
        <SaleProductCard key={product.id} onAddToCart={onAddToCart} product={product} />
      ))}
    </div>
  );
}

/** Renders the New Sale page product browser and add-to-cart actions. */
export default function NewSalePage() {
  const { addItemToCart } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const { products, isLoading, errorMessage } = useSaleProducts(debouncedSearchQuery);

  return (
    <>
      <TopBar title="New Sale" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div className="flex flex-col" style={{ gap: SPACING.lg }}>
          <Card>
            <div className="flex flex-col" style={{ gap: SPACING.lg }}>
              <div>
                <p className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.semibold }}>
                  Product Browser
                </p>
                <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
                  Search available inventory and add items to the current cart.
                </p>
              </div>
              <ProductSearchToolbar onSearchChange={setSearchQuery} searchQuery={searchQuery} />
            </div>
          </Card>
          <ProductBrowserPanel
            errorMessage={errorMessage}
            isLoading={isLoading}
            onAddToCart={addItemToCart}
            products={products}
          />
        </div>
      </div>
    </>
  );
}
