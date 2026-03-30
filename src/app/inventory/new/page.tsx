"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProductForm,
  ProductFormValues,
  createInitialProductFormValues,
} from "@/components/ProductForm";
import { TopBar } from "@/components/TopBar";
import { Product } from "@/database/db";
import { insertProduct } from "@/database/products";
import { LAYOUT, SPACING } from "@/theme/spacing";
import { sanitizeText, validateProductForm } from "@/utils/validateInput";

/** Converts an optional numeric input string into a number or undefined. */
function toOptionalNumber(value: string): number | undefined {
  return value.trim().length ? Number(value) : undefined;
}

/** Converts add-product form values into the database payload. */
function buildProductPayload(
  formValues: ProductFormValues,
): Omit<Product, "id" | "created_at" | "updated_at" | "synced"> {
  return {
    sku: sanitizeText(formValues.sku),
    name: sanitizeText(formValues.name),
    brand: sanitizeText(formValues.brand) || undefined,
    category: sanitizeText(formValues.category),
    unit: sanitizeText(formValues.unit),
    selling_price: Number(formValues.sellingPrice),
    cost_price: toOptionalNumber(formValues.costPrice),
    stock_qty: Number(formValues.stockQty),
    low_stock_threshold: Number(formValues.lowStockThreshold),
    image_url: undefined,
    is_active: 1,
  };
}

/** Renders the add product page with validation and IndexedDB save behavior. */
export default function NewInventoryItemPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState(createInitialProductFormValues());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(fieldName: keyof ProductFormValues, value: string) {
    setFormValues((previousValues) => ({ ...previousValues, [fieldName]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateProductForm(formValues);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await insertProduct(buildProductPayload(formValues));
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
        <ProductForm
          errorMessage={errorMessage}
          formValues={formValues}
          isSubmitting={isSaving}
          onCancel={() => router.back()}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
          submitLabel="Save Product"
        />
      </div>
    </>
  );
}
