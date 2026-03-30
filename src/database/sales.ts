import { generateId } from "@/utils/generateId";
import { sanitizeText } from "@/utils/validateInput";
import { deductStock } from "./products";
import { CartItem, db, Sale, SaleItem } from "./db";

interface SaleInput {
  paymentMethod?: string;
  customerName?: string;
  notes?: string;
  discountAmount?: number;
}

interface TopSellingProduct {
  name: string;
  totalSold: number;
}

/** Returns the most recent sales, ordered newest first. */
export async function getRecentSales(limit = 10): Promise<Sale[]> {
  return db.sales.orderBy("sale_date").reverse().limit(limit).toArray();
}

/** Returns today's total revenue and transaction count from IndexedDB. */
export async function getTodaySalesSummary(): Promise<{
  totalAmount: number;
  transactionCount: number;
}> {
  const todayPrefix = new Date().toISOString().split("T")[0];
  const todaySales = await db.sales.where("sale_date").startsWith(todayPrefix).toArray();

  return {
    totalAmount: todaySales.reduce((sum, saleRecord) => {
      return sum + saleRecord.total_amount;
    }, 0),
    transactionCount: todaySales.length,
  };
}

/** Returns all sale items for a given sale ID. */
export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  return db.sale_items.where("sale_id").equals(saleId).toArray();
}

/** Returns sales within an inclusive ISO date range. */
export async function getSalesByDateRange(
  startDate: string,
  endDate: string,
): Promise<Sale[]> {
  return db.sales
    .where("sale_date")
    .between(
      `${startDate}T00:00:00.000Z`,
      `${endDate}T23:59:59.999Z`,
      true,
      true,
    )
    .reverse()
    .toArray();
}

/** Returns the top selling products by quantity over the selected time window. */
export async function getTopSellingProducts(
  numberOfDays = 30,
  limit = 5,
): Promise<TopSellingProduct[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - numberOfDays);

  const recentSales = await db.sales.where("sale_date").above(cutoffDate.toISOString()).toArray();
  const recentSaleIds = new Set(recentSales.map((saleRecord) => saleRecord.id));
  const recentSaleItems = await db.sale_items
    .filter((saleItem) => recentSaleIds.has(saleItem.sale_id))
    .toArray();

  const aggregatedProducts = new Map<string, TopSellingProduct>();
  for (const saleItem of recentSaleItems) {
    const existingProduct = aggregatedProducts.get(saleItem.product_id);
    aggregatedProducts.set(saleItem.product_id, {
      name: saleItem.product_name,
      totalSold: (existingProduct?.totalSold ?? 0) + saleItem.quantity,
    });
  }

  return [...aggregatedProducts.values()]
    .sort((firstProduct, secondProduct) => secondProduct.totalSold - firstProduct.totalSold)
    .slice(0, limit);
}

/** Creates the sale record payload that will be persisted in the checkout transaction. */
function buildSaleRecord(
  saleId: string,
  saleData: SaleInput,
  cartItems: CartItem[],
  currentTimestamp: string,
): Sale {
  const subtotalAmount = cartItems.reduce((sum, cartItem) => {
    return sum + cartItem.unitPrice * cartItem.quantity;
  }, 0);
  const discountAmount = saleData.discountAmount ?? 0;

  return {
    id: saleId,
    sale_date: currentTimestamp,
    total_amount: subtotalAmount - discountAmount,
    discount_amount: discountAmount,
    payment_method: sanitizeText(saleData.paymentMethod ?? "cash"),
    customer_name: saleData.customerName
      ? sanitizeText(saleData.customerName)
      : undefined,
    notes: saleData.notes ? sanitizeText(saleData.notes) : undefined,
    synced: 0,
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
  };
}

/** Creates a sale item record payload for a single cart item. */
function buildSaleItemRecord(saleId: string, cartItem: CartItem): SaleItem {
  return {
    id: `${saleId}-${cartItem.productId}`,
    sale_id: saleId,
    product_id: cartItem.productId,
    product_name: sanitizeText(cartItem.productName),
    quantity: cartItem.quantity,
    unit_price: cartItem.unitPrice,
    subtotal: cartItem.unitPrice * cartItem.quantity,
  };
}

/** Completes checkout atomically by saving the sale, line items, and stock updates together. */
export async function completeSale(
  saleData: SaleInput,
  cartItems: CartItem[],
): Promise<string> {
  if (!cartItems.length) {
    throw new Error("Cannot complete a sale with an empty cart.");
  }

  const currentTimestamp = new Date().toISOString();
  const saleId = generateId();
  const saleRecord = buildSaleRecord(saleId, saleData, cartItems, currentTimestamp);

  await db.transaction("rw", db.sales, db.sale_items, db.products, async () => {
    await db.sales.add(saleRecord);
    for (const cartItem of cartItems) {
      await db.sale_items.add(buildSaleItemRecord(saleId, cartItem));
      await deductStock(cartItem.productId, cartItem.quantity);
    }
  });

  return saleId;
}

/** Marks a sale as synced after it has been pushed to Supabase. */
export async function markSaleAsSynced(saleId: string): Promise<void> {
  await db.sales.update(saleId, { synced: 1 });
}
