"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ReceiptModal } from "@/components/ReceiptModal";
import { TopBar } from "@/components/TopBar";
import { useAppContext } from "@/context/AppContext";
import { CartItem, Product } from "@/database/db";
import { getAllProducts, getProductBySku, searchProducts } from "@/database/products";
import { completeSale } from "@/database/sales";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { formatCurrency } from "@/utils/formatCurrency";

type PaymentMethod = "cash" | "gcash" | "maya";

interface ProductSearchToolbarProps {
  barcodeErrorMessage: string | null;
  onOpenScanner: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

interface SaleProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

interface CartPanelProps {
  cartItems: CartItem[];
  cartTotal: number;
  checkoutError: string | null;
  isProcessing: boolean;
  onDecreaseQuantity: (productId: string, currentQuantity: number) => void;
  onCharge: () => void;
  onIncreaseQuantity: (productId: string, currentQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onSelectPaymentMethod: (paymentMethod: PaymentMethod) => void;
  selectedPaymentMethod: PaymentMethod;
}

interface CartItemRowProps {
  cartItem: CartItem;
  onDecreaseQuantity: (productId: string, currentQuantity: number) => void;
  onIncreaseQuantity: (productId: string, currentQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

interface ToastNoticeProps {
  message: string | null;
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

/** Returns a short-lived message value for temporary notifications like toasts. */
function useTransientMessage(durationMs: number) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(null), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [durationMs, message]);

  return { message, showMessage: setMessage };
}

/** Loads sellable products for the New Sale browser using the current search query. */
function useSaleProducts(searchQuery: string, refreshKey: number) {
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
  }, [refreshKey, searchQuery]);

  return { products, isLoading, errorMessage };
}

/** Renders the search field, scanner action, and barcode feedback for the New Sale page. */
function ProductSearchToolbar({
  barcodeErrorMessage,
  onOpenScanner,
  searchQuery,
  onSearchChange,
}: ProductSearchToolbarProps) {
  return (
    <div className="flex flex-col" style={{ gap: SPACING.sm }}>
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
        <Button onClick={onOpenScanner} variant="secondary">
          Scan Barcode
        </Button>
      </div>
      {barcodeErrorMessage ? (
        <p className="text-danger" style={{ fontSize: fontSizes.body }}>
          {barcodeErrorMessage}
        </p>
      ) : null}
    </div>
  );
}

/** Renders a brief success toast for barcode scan confirmation. */
function ToastNotice({ message }: ToastNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed z-30 border border-[var(--success)] bg-bg-primary text-text-primary shadow-lg"
      role="status"
      style={{
        top: SPACING.xl,
        right: SPACING.xl,
        borderRadius: RADIUS.md,
        paddingInline: SPACING.lg,
        paddingBlock: SPACING.md,
      }}
    >
      {message}
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

/** Renders a square quantity control button for the cart panel. */
function QuantityButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex items-center justify-center border border-[var(--border)] bg-bg-primary text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      style={{
        width: LAYOUT.minClickTarget,
        minHeight: LAYOUT.minClickTarget,
        borderRadius: RADIUS.md,
        fontSize: fontSizes.section,
        fontWeight: fontWeights.semibold,
      }}
      type="button"
    >
      {label}
    </button>
  );
}

/** Renders one selectable payment method chip in the cart checkout controls. */
function PaymentMethodButton({
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
      className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      style={{
        minHeight: LAYOUT.minClickTarget,
        borderRadius: RADIUS.md,
        paddingInline: SPACING.md,
        paddingBlock: SPACING.sm,
        backgroundColor: isActive ? "var(--accent-navy)" : "var(--bg-primary)",
        color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
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

/** Renders the segmented payment method selector shown above the charge button. */
function PaymentMethodSelector({
  selectedPaymentMethod,
  onSelectPaymentMethod,
}: {
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (paymentMethod: PaymentMethod) => void;
}) {
  return (
    <div className="flex items-center" style={{ gap: SPACING.sm }}>
      <PaymentMethodButton
        isActive={selectedPaymentMethod === "cash"}
        label="Cash"
        onClick={() => onSelectPaymentMethod("cash")}
      />
      <PaymentMethodButton
        isActive={selectedPaymentMethod === "gcash"}
        label="GCash"
        onClick={() => onSelectPaymentMethod("gcash")}
      />
      <PaymentMethodButton
        isActive={selectedPaymentMethod === "maya"}
        label="Maya"
        onClick={() => onSelectPaymentMethod("maya")}
      />
    </div>
  );
}

/** Renders the charge button label or loading state for checkout. */
function ChargeButtonContent({
  isProcessing,
  hasItems,
  cartTotal,
}: {
  isProcessing: boolean;
  hasItems: boolean;
  cartTotal: number;
}) {
  if (isProcessing) {
    return (
      <span className="inline-flex items-center justify-center" style={{ gap: SPACING.sm }}>
        <span
          aria-hidden="true"
          className="animate-spin border-r-transparent"
          style={{
            width: SPACING.lg,
            height: SPACING.lg,
            borderRadius: RADIUS.full,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: "var(--text-on-accent)",
            borderRightColor: "transparent",
          }}
        />
        Processing sale...
      </span>
    );
  }

  return hasItems ? `Charge ${formatCurrency(cartTotal)}` : "Add items to charge";
}

/** Renders the product image or a neutral placeholder for the sale grid. */
function SaleProductImage({
  imageUrl,
  productName,
}: {
  imageUrl?: string;
  productName: string;
}) {
  return (
    <div
      className="overflow-hidden border border-[var(--border)] bg-bg-primary"
      style={{ borderRadius: RADIUS.md }}
    >
      <div
        className="flex items-center justify-center bg-bg-surface text-text-secondary"
        style={{ aspectRatio: "1 / 1" }}
      >
        {imageUrl ? (
          <img
            alt={productName}
            className="h-full w-full object-cover"
            src={imageUrl}
          />
        ) : (
          <ImageIcon aria-hidden="true" size={24} />
        )}
      </div>
    </div>
  );
}

/** Renders a product card with image, stock, price, and add-to-cart behavior. */
function SaleProductCard({ product, onAddToCart }: SaleProductCardProps) {
  const isOutOfStock = product.stock_qty === 0;

  return (
    <Card className="h-full overflow-hidden" style={{ padding: 0 }}>
      <button
        aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
        className="h-full w-full bg-transparent text-left transition-colors duration-200 hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isOutOfStock}
        onClick={() => onAddToCart(product)}
        style={{ padding: SPACING.md }}
        type="button"
      >
        <div className="flex h-full flex-col" style={{ gap: SPACING.md }}>
          <SaleProductImage imageUrl={product.image_url} productName={product.name} />
          <div className="flex flex-1 flex-col justify-between" style={{ gap: SPACING.sm }}>
            <div className="flex flex-col" style={{ gap: SPACING.xs }}>
              <p
                className="text-text-primary"
                style={{ fontSize: fontSizes.body, fontWeight: fontWeights.semibold }}
              >
                {product.name}
              </p>
              <p
                className="text-text-primary"
                style={{ fontSize: fontSizes.price, fontWeight: fontWeights.semibold }}
              >
                {formatCurrency(product.selling_price)}
              </p>
            </div>
            <ProductStockLabel stockQty={product.stock_qty} />
          </div>
        </div>
      </button>
    </Card>
  );
}

/** Renders one editable cart row with quantity controls and subtotal. */
function CartItemRow({
  cartItem,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveItem,
}: CartItemRowProps) {
  const subtotal = cartItem.quantity * cartItem.unitPrice;

  return (
    <div
      className="border border-[var(--border)] bg-bg-primary"
      style={{ borderRadius: RADIUS.md, padding: SPACING.md }}
    >
      <div className="flex items-start justify-between" style={{ gap: SPACING.md }}>
        <div>
          <p className="text-text-primary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}>
            {cartItem.productName}
          </p>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.caption }}>
            {formatCurrency(cartItem.unitPrice)} each
          </p>
        </div>
        <button
          aria-label={`Remove ${cartItem.productName}`}
          className="text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => onRemoveItem(cartItem.productId)}
          style={{
            width: LAYOUT.minClickTarget,
            minHeight: LAYOUT.minClickTarget,
            borderRadius: RADIUS.md,
            fontSize: fontSizes.title,
            fontWeight: fontWeights.medium,
          }}
          type="button"
        >
          ×
        </button>
      </div>
      <div className="flex items-center justify-between" style={{ gap: SPACING.md, marginTop: SPACING.md }}>
        <div className="flex items-center" style={{ gap: SPACING.sm }}>
          <QuantityButton
            label="-"
            onClick={() => onDecreaseQuantity(cartItem.productId, cartItem.quantity)}
          />
          <span className="text-text-primary" style={{ minWidth: LAYOUT.minClickTarget, textAlign: "center", fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}>
            {cartItem.quantity}
          </span>
          <QuantityButton
            label="+"
            onClick={() => onIncreaseQuantity(cartItem.productId, cartItem.quantity)}
          />
        </div>
        <span className="text-text-primary" style={{ fontSize: fontSizes.price, fontWeight: fontWeights.semibold }}>
          {formatCurrency(subtotal)}
        </span>
      </div>
    </div>
  );
}

/** Renders the right-side cart summary panel for the New Sale page. */
function CartPanel({
  cartItems,
  cartTotal,
  checkoutError,
  isProcessing,
  onDecreaseQuantity,
  onCharge,
  onIncreaseQuantity,
  onRemoveItem,
  onSelectPaymentMethod,
  selectedPaymentMethod,
}: CartPanelProps) {
  const hasItems = cartItems.length > 0;

  return (
    <Card className="h-full">
      <div className="flex h-full flex-col" style={{ gap: SPACING.lg }}>
        <div>
          <p className="text-text-primary" style={{ fontSize: fontSizes.title, fontWeight: fontWeights.semibold }}>
            Current Cart
          </p>
          <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
            Review quantities and totals before checkout.
          </p>
        </div>
        {hasItems ? (
          <div className="flex flex-col" style={{ gap: SPACING.md }}>
            {cartItems.map((cartItem) => (
              <CartItemRow
                cartItem={cartItem}
                key={cartItem.productId}
                onDecreaseQuantity={onDecreaseQuantity}
                onIncreaseQuantity={onIncreaseQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center border border-dashed border-[var(--border)] text-text-secondary"
            style={{ borderRadius: RADIUS.md, minHeight: 180, padding: SPACING.lg }}
          >
            Your cart is empty.
          </div>
        )}
        <div
          className="mt-auto"
          style={{ borderTop: "1px solid var(--border)", paddingTop: SPACING.lg }}
        >
          <div className="flex flex-col" style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
            <span className="text-text-secondary" style={{ fontSize: fontSizes.caption, fontWeight: fontWeights.semibold }}>
              Payment Method
            </span>
            <PaymentMethodSelector
              onSelectPaymentMethod={onSelectPaymentMethod}
              selectedPaymentMethod={selectedPaymentMethod}
            />
          </div>
          {checkoutError ? (
            <p className="text-danger" style={{ fontSize: fontSizes.body, fontWeight: fontWeights.medium, marginBottom: SPACING.lg }}>
              {checkoutError}
            </p>
          ) : null}
          <div className="flex items-end justify-between" style={{ gap: SPACING.md, marginBottom: SPACING.lg }}>
            <span className="text-text-secondary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.medium }}>
              Total
            </span>
            <span className="text-text-primary" style={{ fontSize: fontSizes.display, fontWeight: fontWeights.bold }}>
              {formatCurrency(cartTotal)}
            </span>
          </div>
          <Button fullWidth onClick={onCharge} disabled={!hasItems || isProcessing} variant="navy">
            <ChargeButtonContent
              cartTotal={cartTotal}
              hasItems={hasItems}
              isProcessing={isProcessing}
            />
          </Button>
        </div>
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
      style={{
        gap: SPACING.md,
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      }}
    >
      {products.map((product) => (
        <SaleProductCard key={product.id} onAddToCart={onAddToCart} product={product} />
      ))}
    </div>
  );
}

/** Renders the New Sale page product browser and add-to-cart actions. */
export default function NewSalePage() {
  const {
    addItemToCart,
    cartItems,
    cartTotal,
    clearCart,
    removeItemFromCart,
    updateCartItemQuantity,
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { message: toastMessage, showMessage: showToastMessage } = useTransientMessage(2500);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const { products, isLoading, errorMessage } = useSaleProducts(debouncedSearchQuery, refreshKey);

  function decreaseCartQuantity(productId: string, currentQuantity: number) {
    updateCartItemQuantity(productId, Math.max(1, currentQuantity - 1));
  }

  function increaseCartQuantity(productId: string, currentQuantity: number) {
    updateCartItemQuantity(productId, currentQuantity + 1);
  }

  function handleReceiptClose() {
    setIsReceiptVisible(false);
    setCompletedSaleId(null);
    setSelectedPaymentMethod("cash");
  }

  function handleScannerClose() {
    setIsScannerOpen(false);
  }

  function handleScannerOpen() {
    setBarcodeErrorMessage(null);
    setIsScannerOpen(true);
  }

  async function handleBarcodeScan(scannedValue: string) {
    setIsScannerOpen(false);
    setBarcodeErrorMessage(null);

    try {
      const matchedProduct = await getProductBySku(scannedValue);
      if (!matchedProduct) {
        setBarcodeErrorMessage(`No product matched barcode: ${scannedValue}`);
        return;
      }

      addItemToCart(matchedProduct);
      showToastMessage(`${matchedProduct.name} added to cart.`);
    } catch {
      setBarcodeErrorMessage("Unable to look up that barcode right now.");
    }
  }

  async function handleCharge() {
    setIsProcessing(true);
    setCheckoutError(null);

    try {
      const saleId = await completeSale(
        { paymentMethod: selectedPaymentMethod },
        cartItems,
      );
      clearCart();
      setCompletedSaleId(saleId);
      setIsReceiptVisible(true);
      setRefreshKey((previousValue) => previousValue + 1);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <ToastNotice message={toastMessage} />
      <TopBar title="New Sale" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" style={{ gap: SPACING.lg }}>
          <div className="flex min-w-0 flex-col" style={{ gap: SPACING.lg }}>
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
                <ProductSearchToolbar
                  barcodeErrorMessage={barcodeErrorMessage}
                  onOpenScanner={handleScannerOpen}
                  onSearchChange={setSearchQuery}
                  searchQuery={searchQuery}
                />
              </div>
            </Card>
            <ProductBrowserPanel
              errorMessage={errorMessage}
              isLoading={isLoading}
              onAddToCart={addItemToCart}
              products={products}
            />
          </div>
          <CartPanel
            cartItems={cartItems}
            cartTotal={cartTotal}
            checkoutError={checkoutError}
            isProcessing={isProcessing}
            onDecreaseQuantity={decreaseCartQuantity}
            onCharge={handleCharge}
            onIncreaseQuantity={increaseCartQuantity}
            onRemoveItem={removeItemFromCart}
            onSelectPaymentMethod={setSelectedPaymentMethod}
            selectedPaymentMethod={selectedPaymentMethod}
          />
        </div>
      </div>
      <ReceiptModal
        isVisible={isReceiptVisible}
        onClose={handleReceiptClose}
        saleId={completedSaleId}
      />
      <BarcodeScannerDialog
        isOpen={isScannerOpen}
        onClose={handleScannerClose}
        onScan={handleBarcodeScan}
      />
    </>
  );
}
