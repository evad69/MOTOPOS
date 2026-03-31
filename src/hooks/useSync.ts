"use client";

import { useEffect, useState } from "react";
import { registerSyncListener, syncPendingRecords } from "@/services/sync";

interface UseSyncValue {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
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

  useEffect(() => {
    const unregisterSyncListener = registerSyncListener();
    const handleOnline = createOnlineHandler(setIsSyncing, setLastSyncedAt);
    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      void runTrackedSync(setIsSyncing, setLastSyncedAt);
    }

    return () => {
      unregisterSyncListener();
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { isSyncing, lastSyncedAt };
}
