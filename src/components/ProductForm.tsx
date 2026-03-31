"use client";

import { useState, type ChangeEvent, type FormEventHandler, type ReactNode } from "react";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProductImageEditorDialog } from "@/components/ProductImageEditorDialog";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_PRODUCT_UNITS,
} from "@/database/db";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

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
  imageUrl: string;
}

interface ProductFormProps {
  formValues: ProductFormValues;
  errorMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  categoryOptions: string[];
  unitOptions: string[];
  onCancel: () => void;
  onFieldChange: (fieldName: keyof ProductFormValues, value: string) => void;
  onAddCategory: (categoryName: string) => Promise<string>;
  onAddUnit: (unitName: string) => Promise<string>;
  onDeleteCategory: (categoryName: string) => Promise<void>;
  onDeleteUnit: (unitName: string) => Promise<void>;
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
    category: DEFAULT_PRODUCT_CATEGORIES[0],
    unit: DEFAULT_PRODUCT_UNITS[0],
    sellingPrice: "",
    costPrice: "",
    stockQty: "0",
    lowStockThreshold: "5",
    imageUrl: "",
  };
}

/** Reads a selected product image file into a data URL for local persistence. */
async function readProductImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected image."));
    };

    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

/** Wraps a form label and control in consistent vertical spacing. */
function FieldGroup({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span
        className="block text-text-secondary"
        style={{ marginBottom: SPACING.xs, fontSize: fontSizes.caption }}
      >
        {label}
      </span>
      {helper ? (
        <span className="block text-text-secondary" style={{ marginBottom: SPACING.xs, fontSize: 11 }}>
          {helper}
        </span>
      ) : null}
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

/** Renders inline add/delete controls for category and unit option catalogs. */
function ManagedOptionField({
  id,
  label,
  value,
  options,
  onChange,
  onAddOption,
  onDeleteOption,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onAddOption: (optionName: string) => Promise<string>;
  onDeleteOption: (optionName: string) => Promise<void>;
}) {
  const [draftOptionName, setDraftOptionName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  async function handleAddOption() {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      const savedOptionName = await onAddOption(draftOptionName);
      onChange(savedOptionName);
      setDraftOptionName("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : `Unable to add that ${label.toLowerCase()} right now.`,
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteOption(optionName: string) {
    if (options.length <= 1) {
      setErrorMessage(`At least one ${label.toLowerCase()} must remain available.`);
      return;
    }

    if (!window.confirm(`Delete "${optionName}" from the ${label.toLowerCase()} list?`)) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);

    try {
      await onDeleteOption(optionName);
      if (value === optionName) {
        const nextSelectedOption = options.find((option) => option !== optionName);
        if (nextSelectedOption) {
          onChange(nextSelectedOption);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to delete that ${label.toLowerCase()} right now.`,
      );
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: SPACING.sm }}>
      <SelectField id={id} label={label} onChange={onChange} options={options} value={value} />
      <div className="flex flex-col sm:flex-row" style={{ gap: SPACING.sm }}>
        <input
          className="w-full border border-[var(--border)] bg-bg-primary text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onChange={(event) => setDraftOptionName(event.target.value)}
          placeholder={`Add new ${label.toLowerCase()}`}
          style={{
            minHeight: LAYOUT.minClickTarget,
            borderRadius: RADIUS.md,
            paddingInline: SPACING.md,
            paddingBlock: SPACING.sm,
            fontSize: fontSizes.body,
          }}
          type="text"
          value={draftOptionName}
        />
        <Button
          disabled={!draftOptionName.trim().length || isMutating}
          onClick={handleAddOption}
          type="button"
          variant="secondary"
        >
          Add {label}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((optionName) => {
          const isSelected = optionName === value;

          return (
            <div
              className="inline-flex items-center overflow-hidden border border-[var(--border)]"
              key={optionName}
              style={{
                borderRadius: RADIUS.full,
                backgroundColor: isSelected ? "var(--bg-surface)" : "var(--bg-primary)",
              }}
            >
              <button
                className="bg-transparent text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => onChange(optionName)}
                style={{
                  minHeight: 36,
                  paddingInline: SPACING.md,
                  fontSize: fontSizes.caption,
                  fontWeight: isSelected ? fontWeights.semibold : fontWeights.medium,
                }}
                type="button"
              >
                {optionName}
              </button>
              <button
                aria-label={`Delete ${optionName}`}
                className="inline-flex items-center justify-center border-l border-[var(--border)] bg-transparent text-text-secondary transition-colors duration-200 hover:bg-bg-surface hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => void handleDeleteOption(optionName)}
                style={{ minHeight: 36, width: 36 }}
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          );
        })}
      </div>
      {errorMessage ? (
        <p className="text-danger" style={{ fontSize: fontSizes.caption }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/** Renders the shared image preview and upload controls for product forms. */
function ProductImageField({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (value: string) => void;
}) {
  const [editorImageUrl, setEditorImageUrl] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    try {
      const nextImageUrl = await readProductImageFile(file);
      setEditorImageUrl(nextImageUrl);
      setIsEditorOpen(true);
    } catch {
      // Keep the form stable if the browser cannot read the selected file.
    }
  }

  function openEditorForCurrentImage() {
    if (!imageUrl) {
      return;
    }

    setEditorImageUrl(imageUrl);
    setIsEditorOpen(true);
  }

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <span
        className="mb-1 block text-text-secondary"
        style={{ fontSize: fontSizes.caption }}
      >
        Product Image
      </span>
      <div className="flex flex-col" style={{ gap: SPACING.md }}>
        <div
          className="overflow-hidden border border-[var(--border)] bg-bg-primary"
          style={{ borderRadius: RADIUS.md }}
        >
          <div
            className="flex items-center justify-center bg-bg-surface text-text-secondary"
            style={{ aspectRatio: "4 / 3" }}
          >
            {imageUrl ? (
              <img
                alt="Product preview"
                className="h-full w-full object-cover"
                src={imageUrl}
              />
            ) : (
              <div className="flex flex-col items-center justify-center" style={{ gap: SPACING.sm }}>
                <ImageIcon aria-hidden="true" size={28} />
                <span style={{ fontSize: fontSizes.caption }}>No image selected</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row" style={{ gap: SPACING.md }}>
          <label
            className="inline-flex cursor-pointer items-center justify-center border border-[var(--border)] bg-bg-primary text-text-primary transition-colors duration-200 hover:bg-bg-surface focus-within:ring-2 focus-within:ring-accent"
            htmlFor="product-image"
            style={{
              minHeight: LAYOUT.minClickTarget,
              borderRadius: RADIUS.md,
              paddingInline: SPACING.lg,
              paddingBlock: SPACING.sm,
              fontSize: fontSizes.body,
              fontWeight: fontWeights.semibold,
            }}
          >
            {imageUrl ? "Replace Image" : "Upload Image"}
          </label>
          <input
            accept="image/*"
            className="sr-only"
            id="product-image"
            onChange={handleFileChange}
            type="file"
          />
          {imageUrl ? (
            <>
              <Button onClick={openEditorForCurrentImage} type="button" variant="secondary">
                Adjust Image
              </Button>
              <Button onClick={() => onChange("")} type="button" variant="secondary">
                Remove Image
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <ProductImageEditorDialog
        imageUrl={editorImageUrl}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(nextImageUrl) => {
          onChange(nextImageUrl);
          setEditorImageUrl(nextImageUrl);
          setIsEditorOpen(false);
        }}
      />
    </div>
  );
}

/** Renders the shared add/edit product form fields and action buttons. */
export function ProductForm({
  formValues,
  errorMessage,
  isSubmitting,
  submitLabel,
  categoryOptions,
  unitOptions,
  onCancel,
  onFieldChange,
  onAddCategory,
  onAddUnit,
  onDeleteCategory,
  onDeleteUnit,
  onSubmit,
  onDelete,
  isDeleting = false,
}: ProductFormProps) {
  return (
    <Card>
      <form className="flex flex-col" onSubmit={onSubmit} style={{ gap: SPACING.lg }}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col" style={{ gap: SPACING.lg }}>
            <div>
              <p className="text-text-primary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}>
                Product details
              </p>
              <p className="text-text-secondary" style={{ fontSize: fontSizes.caption }}>
                Capture the essentials first, then adjust categories and units on the right.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="name" label="Name" onChange={(value) => onFieldChange("name", value)} value={formValues.name} />
              <TextField id="brand" label="Brand" onChange={(value) => onFieldChange("brand", value)} value={formValues.brand} />
              <TextField id="sku" label="SKU" onChange={(value) => onFieldChange("sku", value)} value={formValues.sku} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="selling-price" label="Selling Price" onChange={(value) => onFieldChange("sellingPrice", value)} type="number" value={formValues.sellingPrice} />
              <TextField id="cost-price" label="Cost Price" onChange={(value) => onFieldChange("costPrice", value)} type="number" value={formValues.costPrice} />
              <TextField id="stock-qty" label="Stock Qty" onChange={(value) => onFieldChange("stockQty", value)} type="number" value={formValues.stockQty} />
              <TextField id="low-stock-threshold" label="Low Stock Threshold" onChange={(value) => onFieldChange("lowStockThreshold", value)} type="number" value={formValues.lowStockThreshold} />
            </div>
            <ProductImageField
              imageUrl={formValues.imageUrl}
              onChange={(value) => onFieldChange("imageUrl", value)}
            />
          </div>
          <div className="flex flex-col" style={{ gap: SPACING.lg }}>
            <div>
              <p className="text-text-primary" style={{ fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}>
                Catalog options
              </p>
              <p className="text-text-secondary" style={{ fontSize: fontSizes.caption }}>
                Keep the pick lists tidy so staff can add items fast.
              </p>
            </div>
            <ManagedOptionField
              id="category"
              label="Category"
              onAddOption={onAddCategory}
              onChange={(value) => onFieldChange("category", value)}
              onDeleteOption={onDeleteCategory}
              options={categoryOptions}
              value={formValues.category}
            />
            <ManagedOptionField
              id="unit"
              label="Unit"
              onAddOption={onAddUnit}
              onChange={(value) => onFieldChange("unit", value)}
              onDeleteOption={onDeleteUnit}
              options={unitOptions}
              value={formValues.unit}
            />
          </div>
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
