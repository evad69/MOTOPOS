"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { Product } from "@/database/db";
import { insertProduct } from "@/database/products";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { sanitizeText, validateProductForm } from "@/utils/validateInput";

const categoryOptions = [
  "Filters",
  "Electrical",
  "Brakes",
  "Drive",
  "Lubricants",
  "Engine",
  "Accessories",
] as const;

const unitOptions = ["pcs", "set", "liter", "pair"] as const;

interface ProductFormState {
  name: string;
  brand: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: string;
  costPrice: string;
  stockQty: string;
  lowStockThreshold: string;
}

interface TextFieldProps {
  id: string;
  label: string;
  type?: "text" | "number";
  value: string;
  onChange: (value: string) => void;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

/** Returns the initial form state used by the add product page. */
function createInitialFormState(): ProductFormState {
  return {
    name: "",
    brand: "",
    sku: "",
    category: categoryOptions[0],
    unit: unitOptions[0],
    sellingPrice: "",
    costPrice: "",
    stockQty: "0",
    lowStockThreshold: "5",
  };
}

/** Converts an optional numeric input string into a number or undefined. */
function toOptionalNumber(value: string): number | undefined {
  return value.trim().length ? Number(value) : undefined;
}

/** Converts form state into the product payload required by the database layer. */
function buildProductPayload(
  formState: ProductFormState,
): Omit<Product, "id" | "created_at" | "updated_at" | "synced"> {
  return {
    sku: sanitizeText(formState.sku),
    name: sanitizeText(formState.name),
    brand: sanitizeText(formState.brand) || undefined,
    category: sanitizeText(formState.category),
    unit: sanitizeText(formState.unit),
    selling_price: Number(formState.sellingPrice),
    cost_price: toOptionalNumber(formState.costPrice),
    stock_qty: Number(formState.stockQty),
    low_stock_threshold: Number(formState.lowStockThreshold),
    image_url: undefined,
    is_active: 1,
  };
}

/** Wraps a label and form control in consistent vertical spacing. */
function FieldGroup({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span
        className="block text-text-secondary"
        style={{ marginBottom: SPACING.xs, fontSize: fontSizes.caption }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/** Renders a styled text or number input for the product form. */
function TextField({ id, label, type = "text", value, onChange }: TextFieldProps) {
  return (
    <FieldGroup htmlFor={id} label={label}>
      <input
        className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: LAYOUT.minClickTarget,
          borderRadius: RADIUS.md,
          paddingInline: SPACING.md,
          paddingBlock: SPACING.sm,
          fontSize: fontSizes.body,
        }}
        type={type}
        value={value}
      />
    </FieldGroup>
  );
}

/** Renders a styled select field for the product form. */
function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  return (
    <FieldGroup htmlFor={id} label={label}>
      <select
        className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        style={{
          minHeight: LAYOUT.minClickTarget,
          borderRadius: RADIUS.md,
          paddingInline: SPACING.md,
          paddingBlock: SPACING.sm,
          fontSize: fontSizes.body,
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldGroup>
  );
}

/** Renders the add product page with validation and IndexedDB save behavior. */
export default function NewInventoryItemPage() {
  const router = useRouter();
  const [formState, setFormState] = useState(createInitialFormState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(fieldName: keyof ProductFormState, value: string) {
    setFormState((previousState) => ({ ...previousState, [fieldName]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateProductForm(formState);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await insertProduct(buildProductPayload(formState));
      router.push("/inventory");
    } catch {
      setErrorMessage("Unable to save the product right now.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Add Product" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <Card>
          <form className="flex flex-col" onSubmit={handleSubmit} style={{ gap: SPACING.lg }}>
            <div
              className="grid"
              style={{ gap: SPACING.lg, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
            >
              <TextField id="name" label="Name" onChange={(value) => updateField("name", value)} value={formState.name} />
              <TextField id="brand" label="Brand" onChange={(value) => updateField("brand", value)} value={formState.brand} />
              <TextField id="sku" label="SKU" onChange={(value) => updateField("sku", value)} value={formState.sku} />
              <SelectField id="category" label="Category" onChange={(value) => updateField("category", value)} options={categoryOptions} value={formState.category} />
              <SelectField id="unit" label="Unit" onChange={(value) => updateField("unit", value)} options={unitOptions} value={formState.unit} />
              <TextField id="selling-price" label="Selling Price" onChange={(value) => updateField("sellingPrice", value)} type="number" value={formState.sellingPrice} />
              <TextField id="cost-price" label="Cost Price" onChange={(value) => updateField("costPrice", value)} type="number" value={formState.costPrice} />
              <TextField id="stock-qty" label="Stock Qty" onChange={(value) => updateField("stockQty", value)} type="number" value={formState.stockQty} />
              <TextField id="low-stock-threshold" label="Low Stock Threshold" onChange={(value) => updateField("lowStockThreshold", value)} type="number" value={formState.lowStockThreshold} />
            </div>
            {errorMessage ? (
              <p className="text-danger" style={{ fontSize: fontSizes.body, fontWeight: fontWeights.medium }}>
                {errorMessage}
              </p>
            ) : null}
            <div className="flex items-center justify-end" style={{ gap: SPACING.md }}>
              <Button onClick={() => router.back()} type="button" variant="secondary">
                Cancel
              </Button>
              <Button isLoading={isSaving} loadingLabel="Saving..." type="submit">
                Save Product
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
