import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

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

export interface ProductFormValues {
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

interface ProductFormProps {
  formValues: ProductFormValues;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  onFieldChange: (fieldName: keyof ProductFormValues, value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDelete?: () => void;
  isDeleting?: boolean;
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

/** Returns the default empty values used by add-product forms. */
export function createInitialProductFormValues(): ProductFormValues {
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

/** Wraps a form label and control in consistent vertical spacing. */
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

/** Renders the shared add/edit product form fields and action buttons. */
export function ProductForm({
  formValues,
  errorMessage,
  isSubmitting,
  submitLabel,
  onCancel,
  onFieldChange,
  onSubmit,
  onDelete,
  isDeleting = false,
}: ProductFormProps) {
  return (
    <Card>
      <form className="flex flex-col" onSubmit={onSubmit} style={{ gap: SPACING.lg }}>
        <div
          className="grid"
          style={{ gap: SPACING.lg, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          <TextField id="name" label="Name" onChange={(value) => onFieldChange("name", value)} value={formValues.name} />
          <TextField id="brand" label="Brand" onChange={(value) => onFieldChange("brand", value)} value={formValues.brand} />
          <TextField id="sku" label="SKU" onChange={(value) => onFieldChange("sku", value)} value={formValues.sku} />
          <SelectField id="category" label="Category" onChange={(value) => onFieldChange("category", value)} options={categoryOptions} value={formValues.category} />
          <SelectField id="unit" label="Unit" onChange={(value) => onFieldChange("unit", value)} options={unitOptions} value={formValues.unit} />
          <TextField id="selling-price" label="Selling Price" onChange={(value) => onFieldChange("sellingPrice", value)} type="number" value={formValues.sellingPrice} />
          <TextField id="cost-price" label="Cost Price" onChange={(value) => onFieldChange("costPrice", value)} type="number" value={formValues.costPrice} />
          <TextField id="stock-qty" label="Stock Qty" onChange={(value) => onFieldChange("stockQty", value)} type="number" value={formValues.stockQty} />
          <TextField id="low-stock-threshold" label="Low Stock Threshold" onChange={(value) => onFieldChange("lowStockThreshold", value)} type="number" value={formValues.lowStockThreshold} />
        </div>
        {errorMessage ? (
          <p className="text-danger" style={{ fontSize: fontSizes.body, fontWeight: fontWeights.medium }}>
            {errorMessage}
          </p>
        ) : null}
        <div className="flex items-center justify-between" style={{ gap: SPACING.md }}>
          <div>
            {onDelete ? (
              <Button isLoading={isDeleting} loadingLabel="Deleting..." onClick={onDelete} variant="danger">
                Delete Product
              </Button>
            ) : null}
          </div>
          <div className="flex items-center justify-end" style={{ gap: SPACING.md }}>
            <Button onClick={onCancel} type="button" variant="secondary">
              Cancel
            </Button>
            <Button isLoading={isSubmitting} loadingLabel="Saving..." type="submit">
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
