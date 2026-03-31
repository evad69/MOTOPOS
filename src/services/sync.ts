import { Product, Sale, db } from "@/database/db";
import { supabase } from "@/services/supabase";

let activeSyncPromise: Promise<void> | null = null;

/** Reports a background sync failure without interrupting the UI. */
function reportSyncError(error: unknown): void {
  console.error("Background sync failed.", error);
}

/** Triggers a background sync when the browser reconnects to the network. */
function handleReconnectSync(): void {
  void syncPendingRecords().catch(reportSyncError);
}

/** Pushes a single unsynced product record to Supabase. */
async function syncProductRecord(product: Product): Promise<void> {
  const { error } = await supabase.from("products").upsert(product, { onConflict: "id" });
  if (error) {
    throw error;
  }

  await db.products.update(product.id, { synced: 1 });
}

/** Pushes all line items for a synced sale to Supabase. */
async function syncSaleItems(saleId: string): Promise<void> {
  const saleItems = await db.sale_items.where("sale_id").equals(saleId).toArray();
  if (!saleItems.length) {
    return;
  }

  const { error } = await supabase.from("sale_items").upsert(saleItems, { onConflict: "id" });
  if (error) {
    throw error;
  }
}

/** Pushes a single unsynced sale record and its line items to Supabase. */
async function syncSaleRecord(saleRecord: Sale): Promise<void> {
  const { error } = await supabase.from("sales").upsert(saleRecord, { onConflict: "id" });
  if (error) {
    throw error;
  }

  await syncSaleItems(saleRecord.id);
  await db.sales.update(saleRecord.id, { synced: 1 });
}

/** Pushes all unsynced products to Supabase and marks them synced locally. */
async function syncUnsyncedProducts(): Promise<void> {
  const unsyncedProducts = await db.products.where("synced").equals(0).toArray();
  for (const product of unsyncedProducts) {
    await syncProductRecord(product);
  }
}

/** Pushes all unsynced sales to Supabase and marks them synced locally. */
async function syncUnsyncedSales(): Promise<void> {
  const unsyncedSales = await db.sales.where("synced").equals(0).toArray();
  for (const saleRecord of unsyncedSales) {
    await syncSaleRecord(saleRecord);
  }
}

/** Runs the full online sync sequence when browser connectivity is available. */
async function runOnlineSync(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return;
  }

  await syncUnsyncedProducts();
  await syncUnsyncedSales();
}

/** Listen for browser connectivity events and trigger sync immediately on reconnect. */
export function registerSyncListener(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("online", handleReconnectSync);
  return () => {
    window.removeEventListener("online", handleReconnectSync);
  };
}

/** Push all unsynced local records to Supabase. Safe to call at any time. */
export async function syncPendingRecords(): Promise<void> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = runOnlineSync().finally(() => {
    activeSyncPromise = null;
  });

  return activeSyncPromise;
}
