"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { db } from "@/database/db";
import { registerSyncListener, syncPendingRecords } from "@/services/sync";

interface UseSyncValue {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasPendingSync: boolean;
}

/** Returns whether IndexedDB currently contains any records waiting for sync. */
async function hasPendingSyncRecords(): Promise<boolean> {
  const [pendingProductCount, pendingSaleCount] = await Promise.all([
    db.products.where("synced").equals(0).count(),
    db.sales.where("synced").equals(0).count(),
  ]);

  return pendingProductCount > 0 || pendingSaleCount > 0;
}

/** Subscribes to Dexie changes and keeps the pending-sync flag current. */
function subscribeToPendingSync(
  setHasPendingSync: React.Dispatch<React.SetStateAction<boolean>>,
): () => void {
  const subscription = liveQuery(hasPendingSyncRecords).subscribe({
    next: setHasPendingSync,
    error: (error) => {
      console.error("Pending sync subscription failed.", error);
    },
  });

  return () => {
    subscription.unsubscribe();
  };
}

/** Runs a sync attempt and updates local hook state around the request. */
async function runTrackedSync(
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>,
  setLastSyncedAt: React.Dispatch<React.SetStateAction<Date | null>>,
): Promise<void> {
  setIsSyncing(true);
  try {
    await syncPendingRecords();
    setLastSyncedAt(new Date());
  } catch (error) {
    console.error("Tracked sync failed.", error);
  } finally {
    setIsSyncing(false);
  }
}

/** Creates the online event handler that updates sync state for the UI. */
function createOnlineHandler(
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>,
  setLastSyncedAt: React.Dispatch<React.SetStateAction<Date | null>>,
): () => void {
  return () => {
    void runTrackedSync(setIsSyncing, setLastSyncedAt);
  };
}

/** Registers the sync listener on mount and triggers a sync on online events. */
export function useSync(): UseSyncValue {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const unregisterSyncListener = registerSyncListener();
    const unsubscribePendingSync = subscribeToPendingSync(setHasPendingSync);
    const handleOnline = createOnlineHandler(setIsSyncing, setLastSyncedAt);
    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      void runTrackedSync(setIsSyncing, setLastSyncedAt);
    }

    return () => {
      unregisterSyncListener();
      unsubscribePendingSync();
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { isSyncing, lastSyncedAt, hasPendingSync };
}
