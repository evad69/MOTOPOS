"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProductForm,
  ProductFormValues,
  createInitialProductFormValues,
} from "@/components/ProductForm";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/database/db";
import { insertProduct } from "@/database/products";
import { useProductOptions } from "@/hooks/useProductOptions";
import { LAYOUT, SPACING } from "@/theme/spacing";
import { sanitizeText, validateProductForm } from "@/utils/validateInput";

/** Converts an optional numeric input string into a number or undefined. */
function toOptionalNumber(value: string): number | undefined {
  return value.trim().length ? Number(value) : undefined;
}

/** Converts add-product form values into the database payload. */
function buildProductPayload(
  formValues: ProductFormValues,
  ownerId: string,
): Omit<Product, "id" | "created_at" | "updated_at" | "synced"> {
  return {
    owner_id: ownerId,
    sku: sanitizeText(formValues.sku),
    name: sanitizeText(formValues.name),
    brand: sanitizeText(formValues.brand) || undefined,
    category: sanitizeText(formValues.category),
    unit: sanitizeText(formValues.unit),
    selling_price: Number(formValues.sellingPrice),
    cost_price: toOptionalNumber(formValues.costPrice),
    stock_qty: Number(formValues.stockQty),
    low_stock_threshold: Number(formValues.lowStockThreshold),
    image_url: sanitizeText(formValues.imageUrl) || undefined,
    is_active: 1,
  };
}

/** Renders the add product page with validation and IndexedDB save behavior. */
export default function NewInventoryItemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formValues, setFormValues] = useState(createInitialProductFormValues());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const {
    categoryOptions,
    unitOptions,
    errorMessage: optionsErrorMessage,
    addOption,
    deleteOption,
  } = useProductOptions();

  useEffect(() => {
    setFormValues((previousValues) => {
      const nextCategory = categoryOptions.includes(previousValues.category)
        ? previousValues.category
        : categoryOptions[0];
      const nextUnit = unitOptions.includes(previousValues.unit)
        ? previousValues.unit
        : unitOptions[0];

      if (nextCategory === previousValues.category && nextUnit === previousValues.unit) {
        return previousValues;
      }

      return {
        ...previousValues,
        category: nextCategory,
        unit: nextUnit,
      };
    });
  }, [categoryOptions, unitOptions]);

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
    if (!user?.id) {
      setErrorMessage("Owner session is missing. Please sign in again.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await insertProduct(buildProductPayload(formValues, user.id));
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
          categoryOptions={categoryOptions}
          errorMessage={errorMessage ?? optionsErrorMessage}
          formValues={formValues}
          isSubmitting={isSaving}
          onAddCategory={(categoryName) => addOption("category", categoryName)}
          onAddUnit={(unitName) => addOption("unit", unitName)}
          onCancel={() => router.back()}
          onDeleteCategory={(categoryName) => deleteOption("category", categoryName)}
          onDeleteUnit={(unitName) => deleteOption("unit", unitName)}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
          submitLabel="Save Product"
          unitOptions={unitOptions}
        />
      </div>
    </>
  );
}
