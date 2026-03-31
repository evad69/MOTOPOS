import { Product, Sale, SaleItem, db } from "@/database/db";
import { isSupabaseConfigured, supabase } from "@/services/supabase";

let activeSyncPromise: Promise<void> | null = null;
const remotePageSize = 500;

/** Reports a background sync failure without interrupting the UI. */
function reportSyncError(error: unknown): void {
  console.error("Background sync failed.", error);
}

/** Triggers a background sync when the browser reconnects to the network. */
function handleReconnectSync(): void {
  void syncPendingRecords().catch(reportSyncError);
}

/** Returns true when a local unsynced record should win over a pulled remote copy. */
function shouldKeepLocalChange(
  localRecord: { synced: number; updated_at: string },
  remoteRecord: { updated_at: string },
): boolean {
  if (localRecord.synced !== 0) {
    return false;
  }

  return (
    new Date(localRecord.updated_at).getTime() >
    new Date(remoteRecord.updated_at).getTime()
  );
}

/** Returns the current authenticated owner id or null when unavailable. */
async function getCurrentOwnerId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Unable to read the current auth user.", error);
    return null;
  }

  return data.user?.id ?? null;
}

/** Reads every row from a Supabase table, handling pagination beyond the default page size. */
async function fetchAllRemoteRows<RowType>(
  tableName: "products" | "sales" | "sale_items",
  orderColumn: "updated_at" | "id",
  ownerId: string,
): Promise<RowType[]> {
  const rows: RowType[] = [];
  let rangeStart = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("owner_id", ownerId)
      .order(orderColumn, { ascending: true })
      .range(rangeStart, rangeStart + remotePageSize - 1);

    if (error) {
      throw error;
    }

    const nextRows = (data as RowType[] | null) ?? [];
    rows.push(...nextRows);

    if (nextRows.length < remotePageSize) {
      return rows;
    }

    rangeStart += remotePageSize;
  }
}

/** Merges remote products into IndexedDB while preserving any newer local unsynced edits. */
async function pullRemoteProducts(ownerId: string): Promise<void> {
  const [remoteProducts, localProducts] = await Promise.all([
    fetchAllRemoteRows<Product>("products", "updated_at", ownerId),
    db.products.toArray(),
  ]);
  const localProductMap = new Map(localProducts.map((product) => [product.id, product]));
  const remoteProductIds = new Set(remoteProducts.map((product) => product.id));
  const mergedProducts = remoteProducts.map((remoteProduct) => {
    const localProduct = localProductMap.get(remoteProduct.id);
    if (localProduct && shouldKeepLocalChange(localProduct, remoteProduct)) {
      return localProduct;
    }

    return { ...remoteProduct, synced: 1 };
  });
  const unsyncedLocalOnlyProducts = localProducts.filter((product) => {
    return product.synced === 0 && !remoteProductIds.has(product.id);
  });
  const staleSyncedProductIds = localProducts
    .filter((product) => product.synced === 1 && !remoteProductIds.has(product.id))
    .map((product) => product.id);

  await db.products.bulkPut([...mergedProducts, ...unsyncedLocalOnlyProducts]);
  if (staleSyncedProductIds.length) {
    await db.products.bulkDelete(staleSyncedProductIds);
  }
}

/** Merges remote sales into IndexedDB while preserving any newer local unsynced edits. */
async function pullRemoteSales(ownerId: string): Promise<void> {
  const [remoteSales, localSales] = await Promise.all([
    fetchAllRemoteRows<Sale>("sales", "updated_at", ownerId),
    db.sales.toArray(),
  ]);
  const localSaleMap = new Map(localSales.map((saleRecord) => [saleRecord.id, saleRecord]));
  const remoteSaleIds = new Set(remoteSales.map((saleRecord) => saleRecord.id));
  const mergedSales = remoteSales.map((remoteSale) => {
    const localSale = localSaleMap.get(remoteSale.id);
    if (localSale && shouldKeepLocalChange(localSale, remoteSale)) {
      return localSale;
    }

    return { ...remoteSale, synced: 1 };
  });
  const unsyncedLocalOnlySales = localSales.filter((saleRecord) => {
    return saleRecord.synced === 0 && !remoteSaleIds.has(saleRecord.id);
  });
  const staleSyncedSaleIds = localSales
    .filter((saleRecord) => saleRecord.synced === 1 && !remoteSaleIds.has(saleRecord.id))
    .map((saleRecord) => saleRecord.id);

  await db.sales.bulkPut([...mergedSales, ...unsyncedLocalOnlySales]);
  if (staleSyncedSaleIds.length) {
    await db.sales.bulkDelete(staleSyncedSaleIds);
  }
}

/** Mirrors remote sale items into IndexedDB after the parent sales have been pushed. */
async function pullRemoteSaleItems(ownerId: string): Promise<void> {
  const [remoteSaleItems, localSaleItems] = await Promise.all([
    fetchAllRemoteRows<SaleItem>("sale_items", "id", ownerId),
    db.sale_items.toArray(),
  ]);
  const remoteSaleItemIds = new Set(remoteSaleItems.map((saleItem) => saleItem.id));
  const staleLocalSaleItemIds = localSaleItems
    .filter((saleItem) => !remoteSaleItemIds.has(saleItem.id))
    .map((saleItem) => saleItem.id);

  await db.sale_items.bulkPut(remoteSaleItems);
  if (staleLocalSaleItemIds.length) {
    await db.sale_items.bulkDelete(staleLocalSaleItemIds);
  }
}

/** Ensures a product record has the correct owner id. */
async function ensureProductOwner(
  product: Product,
  ownerId: string,
): Promise<Product> {
  if (product.owner_id === ownerId) {
    return product;
  }

  const nextProduct = { ...product, owner_id: ownerId };
  await db.products.update(product.id, { owner_id: ownerId });
  return nextProduct;
}

/** Ensures a sale record has the correct owner id. */
async function ensureSaleOwner(
  saleRecord: Sale,
  ownerId: string,
): Promise<Sale> {
  if (saleRecord.owner_id === ownerId) {
    return saleRecord;
  }

  const nextSale = { ...saleRecord, owner_id: ownerId };
  await db.sales.update(saleRecord.id, { owner_id: ownerId });
  return nextSale;
}

/** Ensures a batch of sale items have the correct owner id. */
async function ensureSaleItemOwners(
  saleItems: SaleItem[],
  ownerId: string,
): Promise<SaleItem[]> {
  let shouldUpdate = false;
  const nextItems = saleItems.map((saleItem) => {
    if (saleItem.owner_id === ownerId) {
      return saleItem;
    }

    shouldUpdate = true;
    return { ...saleItem, owner_id: ownerId };
  });

  if (shouldUpdate) {
    await db.sale_items.bulkPut(nextItems);
  }

  return nextItems;
}

/** Pushes a single unsynced product record to Supabase. */
async function syncProductRecord(product: Product, ownerId: string): Promise<void> {
  const safeProduct = await ensureProductOwner(product, ownerId);
  const { error } = await supabase.from("products").upsert(safeProduct, { onConflict: "id" });
  if (error) {
    throw error;
  }

  await db.products.update(product.id, { synced: 1 });
}

/** Pushes all line items for a synced sale to Supabase. */
async function syncSaleItems(saleId: string, ownerId: string): Promise<void> {
  const saleItems = await db.sale_items.where("sale_id").equals(saleId).toArray();
  if (!saleItems.length) {
    return;
  }

  const safeSaleItems = await ensureSaleItemOwners(saleItems, ownerId);
  const { error } = await supabase.from("sale_items").upsert(safeSaleItems, { onConflict: "id" });
  if (error) {
    throw error;
  }
}

/** Pushes a single unsynced sale record and its line items to Supabase. */
async function syncSaleRecord(saleRecord: Sale, ownerId: string): Promise<void> {
  const safeSaleRecord = await ensureSaleOwner(saleRecord, ownerId);
  const { error } = await supabase.from("sales").upsert(safeSaleRecord, { onConflict: "id" });
  if (error) {
    throw error;
  }

  await syncSaleItems(safeSaleRecord.id, ownerId);
  await db.sales.update(saleRecord.id, { synced: 1 });
}

/** Pushes all unsynced products to Supabase and marks them synced locally. */
async function syncUnsyncedProducts(ownerId: string): Promise<void> {
  const unsyncedProducts = await db.products.where("synced").equals(0).toArray();
  for (const product of unsyncedProducts) {
    await syncProductRecord(product, ownerId);
  }
}

/** Pushes all unsynced sales to Supabase and marks them synced locally. */
async function syncUnsyncedSales(ownerId: string): Promise<void> {
  const unsyncedSales = await db.sales.where("synced").equals(0).toArray();
  for (const saleRecord of unsyncedSales) {
    await syncSaleRecord(saleRecord, ownerId);
  }
}

/** Runs the full online sync sequence when browser connectivity is available. */
async function runOnlineSync(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !navigator.onLine ||
    !isSupabaseConfigured()
  ) {
    return;
  }

  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    return;
  }

  await syncUnsyncedProducts(ownerId);
  await syncUnsyncedSales(ownerId);
  await pullRemoteProducts(ownerId);
  await pullRemoteSales(ownerId);
  await pullRemoteSaleItems(ownerId);
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
