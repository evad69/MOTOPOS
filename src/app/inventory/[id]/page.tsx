"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProductForm, ProductFormValues } from "@/components/ProductForm";
import { TopBar } from "@/components/TopBar";
import { Product } from "@/database/db";
import {
  getProductById,
  softDeleteProduct,
  updateProduct,
} from "@/database/products";
import { LAYOUT, SPACING } from "@/theme/spacing";
import { sanitizeText, validateProductForm } from "@/utils/validateInput";

/** Converts a product record into edit-form values. */
function createFormValuesFromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    brand: product.brand ?? "",
    sku: product.sku,
    category: product.category,
    unit: product.unit,
    sellingPrice: String(product.selling_price),
    costPrice: product.cost_price !== undefined ? String(product.cost_price) : "",
    stockQty: String(product.stock_qty),
    lowStockThreshold: String(product.low_stock_threshold),
  };
}

/** Converts an optional numeric input string into a number or undefined. */
function toOptionalNumber(value: string): number | undefined {
  return value.trim().length ? Number(value) : undefined;
}

/** Converts edit-form values into the product changes payload used by Dexie. */
function buildProductChanges(
  formValues: ProductFormValues,
): Partial<Omit<Product, "id" | "created_at">> {
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
  };
}

/** Loads the editable product form state for a given inventory item ID. */
function useEditableProduct(productId: string) {
  const [formValues, setFormValues] = useState<ProductFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage(null);
      const product = await getProductById(productId);
      if (isCancelled) {
        return;
      }

      if (!product) {
        setErrorMessage("Product not found.");
        setFormValues(null);
      } else {
        setFormValues(createFormValuesFromProduct(product));
      }
      setIsLoading(false);
    }

    void loadProduct();
    return () => {
      isCancelled = true;
    };
  }, [productId]);

  return { formValues, setFormValues, errorMessage, setErrorMessage, isLoading };
}

/** Renders a simple status card for loading and not-found edit-page states. */
function EditPageStatus({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Card>
      <div className="flex flex-col" style={{ gap: SPACING.md }}>
        <p className="text-text-primary">{message}</p>
        <div>
          <Button onClick={onBack} variant="secondary">
            Back to Inventory
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Renders the edit product page with preload, save, and soft-delete behavior. */
export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { formValues, setFormValues, errorMessage, setErrorMessage, isLoading } =
    useEditableProduct(productId);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function updateField(fieldName: keyof ProductFormValues, value: string) {
    setFormValues((previousValues) => {
      if (!previousValues) {
        return previousValues;
      }

      return { ...previousValues, [fieldName]: value };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formValues) {
      return;
    }

    const validationMessage = validateProductForm(formValues);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateProduct(productId, buildProductChanges(formValues));
      router.push("/inventory");
    } catch {
      setErrorMessage("Unable to update the product right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this product from the inventory list?")) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await softDeleteProduct(productId);
      router.push("/inventory");
    } catch {
      setErrorMessage("Unable to delete the product right now.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <TopBar title="Edit Product" />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        {isLoading ? <EditPageStatus message="Loading product..." onBack={() => router.push("/inventory")} /> : null}
        {!isLoading && !formValues ? <EditPageStatus message={errorMessage ?? "Product not found."} onBack={() => router.push("/inventory")} /> : null}
        {!isLoading && formValues ? (
          <ProductForm
            errorMessage={errorMessage}
            formValues={formValues}
            isDeleting={isDeleting}
            isSubmitting={isSaving}
            onCancel={() => router.push("/inventory")}
            onDelete={handleDelete}
            onFieldChange={updateField}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        ) : null}
      </div>
    </>
  );
}
