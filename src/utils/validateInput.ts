interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  unit: string;
  sellingPrice: number | string;
  stockQty: number | string;
}

/** Validates product form values and returns an error message when invalid. */
export function validateProductForm({
  name,
  sku,
  category,
  unit,
  sellingPrice,
  stockQty,
}: ProductFormValues): string | null {
  if (!name || name.trim().length === 0) return "Product name is required.";
  if (!sku || sku.trim().length === 0) return "SKU is required.";
  if (!category || category.trim().length === 0) return "Category is required.";
  if (!unit || unit.trim().length === 0) return "Unit is required.";
  if (isNaN(Number(sellingPrice)) || Number(sellingPrice) <= 0) {
    return "Selling price must be a positive number.";
  }
  if (isNaN(Number(stockQty)) || Number(stockQty) < 0) {
    return "Stock quantity cannot be negative.";
  }

  return null;
}

/** Trims whitespace from a user-provided text value before persistence. */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}
