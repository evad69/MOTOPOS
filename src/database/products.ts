import { generateId } from "@/utils/generateId";
import { syncPendingRecords } from "@/services/sync";
import { sanitizeText } from "@/utils/validateInput";
import { db, Product } from "./db";

/** Returns all active products ordered alphabetically by name. */
export async function getAllProducts(): Promise<Product[]> {
  return db.products.where("is_active").equals(1).sortBy("name");
}

/** Returns a single product by its ID, or undefined if not found. */
export async function getProductById(
  productId: string,
): Promise<Product | undefined> {
  return db.products.get(productId);
}

/** Returns a product matching a given SKU (barcode), or undefined. */
export async function getProductBySku(sku: string): Promise<Product | undefined> {
  return db.products
    .where("sku")
    .equals(sanitizeText(sku))
    .filter((product) => product.is_active === 1)
    .first();
}

/** Returns all products at or below their low stock threshold. */
export async function getLowStockProducts(): Promise<Product[]> {
  const activeProducts = await db.products.where("is_active").equals(1).toArray();

  return activeProducts
    .filter((product) => product.stock_qty <= product.low_stock_threshold)
    .sort((firstProduct, secondProduct) => {
      return firstProduct.stock_qty - secondProduct.stock_qty;
    });
}

/** Returns products whose name, brand, or SKU contains the search query. */
export async function searchProducts(query: string): Promise<Product[]> {
  const normalizedQuery = sanitizeText(query).toLowerCase();
  if (!normalizedQuery) {
    return getAllProducts();
  }

  const activeProducts = await db.products.where("is_active").equals(1).toArray();
  return activeProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      (product.brand ?? "").toLowerCase().includes(normalizedQuery) ||
      product.sku.toLowerCase().includes(normalizedQuery)
    );
  });
}

/** Inserts a new product and returns the generated product ID. */
export async function insertProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at" | "synced">,
): Promise<string> {
  const currentTimestamp = new Date().toISOString();
  const productId = generateId();

  await db.products.add({
    ...productData,
    id: productId,
    synced: 0,
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
  });
  void syncPendingRecords().catch(() => undefined);

  return productId;
}

/** Updates an existing product and marks it for background sync. */
export async function updateProduct(
  productId: string,
  changes: Partial<Omit<Product, "id" | "created_at">>,
  shouldSync = true,
): Promise<void> {
  await db.products.update(productId, {
    ...changes,
    synced: 0,
    updated_at: new Date().toISOString(),
  });
  if (shouldSync) {
    void syncPendingRecords().catch(() => undefined);
  }
}

/** Soft-deletes a product so sale history can still reference it. */
export async function softDeleteProduct(productId: string): Promise<void> {
  await updateProduct(productId, { is_active: 0 });
}

/** Deducts product stock as part of the checkout transaction flow. */
export async function deductStock(
  productId: string,
  quantity: number,
): Promise<void> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found during stock deduction.`);
  }

  const updatedStockQuantity = Math.max(0, product.stock_qty - quantity);
  await updateProduct(productId, { stock_qty: updatedStockQuantity }, false);
}
