"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StockBadge } from "@/components/StockBadge";
import { TopBar } from "@/components/TopBar";
import { Product } from "@/database/db";
import {
  getAllProducts,
  getLowStockProducts,
  searchProducts,
} from "@/database/products";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

type InventoryTab = "all" | "low-stock" | "by-category";

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
  errorMessage: string | null;
  onSelectProduct: (productId: string) => void;
}

interface InventoryTabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface InventorySearchFieldProps {
  searchQuery: string;
  onChange: (value: string) => void;
}

interface CategorySection {
  categoryName: string;
  products: Product[];
}

interface CategorySectionCardProps {
  section: CategorySection;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectProduct: (productId: string) => void;
}

/** Returns products ordered by category and then by product name. */
function sortProductsByCategory(products: Product[]): Product[] {
  return [...products].sort((firstProduct, secondProduct) => {
    const categoryComparison = firstProduct.category.localeCompare(secondProduct.category);
    if (categoryComparison !== 0) {
      return categoryComparison;
    }

    return firstProduct.name.localeCompare(secondProduct.name);
  });
}

/** Returns the product list that matches the active tab and debounced search query. */
async function queryInventoryProducts(
  activeTab: InventoryTab,
  searchQuery: string,
): Promise<Product[]> {
  const hasSearchQuery = searchQuery.trim().length > 0;
  const baseProducts = hasSearchQuery
    ? await searchProducts(searchQuery)
    : activeTab === "low-stock"
      ? await getLowStockProducts()
      : await getAllProducts();

  if (activeTab === "low-stock" && hasSearchQuery) {
    return baseProducts.filter((product) => product.stock_qty <= product.low_stock_threshold);
  }

  return activeTab === "by-category" ? sortProductsByCategory(baseProducts) : baseProducts;
}

/** Groups products into category sections for the By Category inventory tab. */
function groupProductsByCategory(products: Product[]): CategorySection[] {
  const sectionMap = new Map<string, Product[]>();

  for (const product of sortProductsByCategory(products)) {
    const categoryName = product.category || "Uncategorized";
    const sectionProducts = sectionMap.get(categoryName) ?? [];
    sectionProducts.push(product);
    sectionMap.set(categoryName, sectionProducts);
  }

  return Array.from(sectionMap.entries()).map(([categoryName, sectionProducts]) => ({
    categoryName,
    products: sectionProducts,
  }));
}

/** Preserves section toggle state while defaulting newly seen categories to expanded. */
function buildExpandedCategoryState(
  sections: CategorySection[],
  previousState: Record<string, boolean>,
): Record<string, boolean> {
  return sections.reduce<Record<string, boolean>>((nextState, section) => {
    nextState[section.categoryName] = previousState[section.categoryName] ?? true;
    return nextState;
  }, {});
}

/** Returns a debounced copy of a value to avoid running queries on every key press. */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

/** Loads inventory data and refreshes it whenever the tab becomes visible again. */
function useInventoryProducts(activeTab: InventoryTab, searchQuery: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const nextProducts = await queryInventoryProducts(activeTab, searchQuery);
        if (!isCancelled) {
          setProducts(nextProducts);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("Unable to load inventory right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadProducts();
      }
    }

    void loadProducts();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTab, searchQuery]);

  return { products, isLoading, errorMessage };
}

/** Renders a themed inventory tab button with an active underline state. */
function InventoryTabButton({ label, isActive, onClick }: InventoryTabButtonProps) {
  return (
    <button
      className="bg-transparent text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={onClick}
      style={{
        minHeight: LAYOUT.minClickTarget,
        borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
        paddingInline: SPACING.sm,
        fontSize: fontSizes.body,
        fontWeight: isActive ? fontWeights.semibold : fontWeights.medium,
      }}
      type="button"
    >
      {label}
    </button>
  );
}

/** Renders the inventory search field used for debounced product lookups. */
function InventorySearchField({ searchQuery, onChange }: InventorySearchFieldProps) {
  return (
    <label className="block">
      <span className="sr-only">Search inventory</span>
      <input
        className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onChange={(event) => onChange(event.target.value)}
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
  );
}

/** Renders the inventory list header row used above the product rows. */
function InventoryTableHeader() {
  return (
    <div
      className="grid text-text-secondary"
      style={{
        gap: SPACING.md,
        gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 1.4fr",
        paddingBottom: SPACING.sm,
        fontSize: fontSizes.caption,
        fontWeight: fontWeights.semibold,
      }}
    >
      <span>Name</span>
      <span>SKU</span>
      <span>Category</span>
      <span>Stock</span>
      <span>Status</span>
    </div>
  );
}

/** Renders one clickable product row in the inventory list. */
function InventoryTableRow({
  product,
  onSelectProduct,
}: {
  product: Product;
  onSelectProduct: (productId: string) => void;
}) {
  return (
    <button
      className="grid w-full items-center border-0 bg-transparent text-left text-text-primary transition-colors duration-200 hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      onClick={() => onSelectProduct(product.id)}
      style={{
        gap: SPACING.md,
        gridTemplateColumns: "2fr 1.2fr 1.2fr 1fr 1.4fr",
        minHeight: LAYOUT.minClickTarget,
        borderRadius: RADIUS.md,
        paddingInline: SPACING.md,
        paddingBlock: SPACING.md,
      }}
      type="button"
    >
      <span style={{ fontWeight: fontWeights.semibold }}>{product.name}</span>
      <span className="text-text-secondary">{product.sku}</span>
      <span className="text-text-secondary">{product.category}</span>
      <span>{product.stock_qty}</span>
      <StockBadge
        lowStockThreshold={product.low_stock_threshold}
        stockQty={product.stock_qty}
      />
    </button>
  );
}

/** Renders the inventory table body and its loading or empty states. */
function InventoryTable({
  products,
  isLoading,
  errorMessage,
  onSelectProduct,
}: InventoryTableProps) {
  if (isLoading) {
    return <Card>Loading inventory...</Card>;
  }

  if (errorMessage) {
    return <Card>{errorMessage}</Card>;
  }

  if (!products.length) {
    return <Card>No products matched the current tab and search.</Card>;
  }

  return (
    <Card>
      <InventoryTableHeader />
      <div style={{ marginTop: SPACING.sm }}>
        {products.map((product) => (
          <InventoryTableRow
            key={product.id}
            onSelectProduct={onSelectProduct}
            product={product}
          />
        ))}
      </div>
    </Card>
  );
}

/** Renders one collapsible category card in the grouped inventory view. */
function CategorySectionCard({
  section,
  isExpanded,
  onToggle,
  onSelectProduct,
}: CategorySectionCardProps) {
  return (
    <Card style={{ padding: 0 }}>
      <button
        className="flex w-full items-center justify-between bg-bg-secondary text-text-secondary font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={onToggle}
        style={{
          minHeight: LAYOUT.minClickTarget,
          paddingInline: SPACING.lg,
          paddingBlock: SPACING.md,
          fontSize: fontSizes.body,
        }}
        type="button"
      >
        <span>
          {section.categoryName} ({section.products.length})
        </span>
        <span>{isExpanded ? "Collapse" : "Expand"}</span>
      </button>
      {isExpanded ? (
        <div style={{ borderTop: "1px solid var(--border)", padding: SPACING.lg }}>
          <InventoryTableHeader />
          <div style={{ marginTop: SPACING.sm }}>
            {section.products.map((product) => (
              <InventoryTableRow
                key={product.id}
                onSelectProduct={onSelectProduct}
                product={product}
              />
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Renders grouped inventory sections with collapsible category headers. */
function CategorySectionList({
  products,
  isLoading,
  errorMessage,
  onSelectProduct,
}: InventoryTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const sections = groupProductsByCategory(products);

  useEffect(() => {
    const nextSections = groupProductsByCategory(products);
    setExpandedCategories((previousState) =>
      buildExpandedCategoryState(nextSections, previousState),
    );
  }, [products]);

  function toggleCategory(categoryName: string) {
    setExpandedCategories((previousState) => ({
      ...previousState,
      [categoryName]: !(previousState[categoryName] ?? true),
    }));
  }

  if (isLoading) {
    return <Card>Loading inventory...</Card>;
  }

  if (errorMessage) {
    return <Card>{errorMessage}</Card>;
  }

  if (!sections.length) {
    return <Card>No products matched the current tab and search.</Card>;
  }

  return (
    <div className="flex flex-col" style={{ gap: SPACING.md }}>
      {sections.map((section) => (
        <CategorySectionCard
          isExpanded={expandedCategories[section.categoryName] ?? true}
          key={section.categoryName}
          onToggle={() => toggleCategory(section.categoryName)}
          onSelectProduct={onSelectProduct}
          section={section}
        />
      ))}
    </div>
  );
}

/** Renders the inventory list page with tabs, search, and product table navigation. */
export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InventoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const { products, isLoading, errorMessage } = useInventoryProducts(
    activeTab,
    debouncedSearchQuery,
  );

  return (
    <>
      <TopBar title="Inventory" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <div
          className="flex flex-col"
          style={{ gap: SPACING.lg }}
        >
          <div className="flex items-center justify-between" style={{ gap: SPACING.lg }}>
            <div className="flex items-center" style={{ gap: SPACING.md }}>
              <InventoryTabButton
                isActive={activeTab === "all"}
                label="All Items"
                onClick={() => setActiveTab("all")}
              />
              <InventoryTabButton
                isActive={activeTab === "low-stock"}
                label="Low Stock"
                onClick={() => setActiveTab("low-stock")}
              />
              <InventoryTabButton
                isActive={activeTab === "by-category"}
                label="By Category"
                onClick={() => setActiveTab("by-category")}
              />
            </div>
            <Button onClick={() => router.push("/inventory/new")}>+ Add Product</Button>
          </div>
          <InventorySearchField onChange={setSearchQuery} searchQuery={searchQuery} />
          {activeTab === "by-category" ? (
            <CategorySectionList
              errorMessage={errorMessage}
              isLoading={isLoading}
              onSelectProduct={(productId) => router.push(`/inventory/${productId}`)}
              products={products}
            />
          ) : (
            <InventoryTable
              errorMessage={errorMessage}
              isLoading={isLoading}
              onSelectProduct={(productId) => router.push(`/inventory/${productId}`)}
              products={products}
            />
          )}
        </div>
      </div>
    </>
  );
}
