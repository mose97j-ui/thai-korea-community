import { isOperatorUser } from "@/lib/auth/operator";
import { getSessionUser } from "@/lib/auth/storage";
import {
  applyRemoteOperatorMenuStore,
  getOperatorMenuSyncedAt,
  getPersistedOperatorMenuStore,
  markOperatorMenuSyncedAt,
  type OperatorMenuStore,
} from "@/lib/categories/operatorMenus";

const SYNC_DEBOUNCE_MS = 400;

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function isEmptyOperatorMenuStore(store: OperatorMenuStore): boolean {
  return (
    store.addedCategories.length === 0 &&
    store.addedSubcategories.length === 0 &&
    Object.keys(store.categoryOverrides).length === 0 &&
    Object.keys(store.subcategoryOverrides).length === 0 &&
    (store.categoryOrder?.length ?? 0) === 0
  );
}

function isRemoteNewer(remoteUpdatedAt: string, localSyncedAt: string | null): boolean {
  if (!localSyncedAt) {
    return true;
  }
  return new Date(remoteUpdatedAt).getTime() > new Date(localSyncedAt).getTime();
}

/** Pull shared operator menu config from the server. */
export async function fetchAndMergeOperatorMenusFromServer(): Promise<boolean> {
  try {
    const response = await fetch("/api/operator-menus", {
      cache: "no-store",
      headers: { Pragma: "no-cache" },
    });
    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      store?: OperatorMenuStore;
      updatedAt?: string;
    };

    const store = payload.store;
    const updatedAt = payload.updatedAt;
    if (!store || !updatedAt) {
      return false;
    }

    const localStore = getPersistedOperatorMenuStore();
    if (isEmptyOperatorMenuStore(store) && !isEmptyOperatorMenuStore(localStore)) {
      if (isOperatorUser(getSessionUser())) {
        void syncOperatorMenusToServer();
      }
      return false;
    }

    const localSyncedAt = getOperatorMenuSyncedAt();
    if (!isRemoteNewer(updatedAt, localSyncedAt)) {
      return false;
    }

    return applyRemoteOperatorMenuStore(store, updatedAt);
  } catch {
    return false;
  }
}

/** Push operator menu config to the server (operator session only). */
export async function syncOperatorMenusToServer(): Promise<boolean> {
  const session = getSessionUser();
  if (!isOperatorUser(session)) {
    return false;
  }

  try {
    const response = await fetch("/api/operator-menus/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: getPersistedOperatorMenuStore(),
        operatorGmail: session?.gmail,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { updatedAt?: string };
    if (payload.updatedAt) {
      markOperatorMenuSyncedAt(payload.updatedAt);
    }

    return true;
  } catch {
    return false;
  }
}

export function scheduleOperatorMenuSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncOperatorMenusToServer();
  }, SYNC_DEBOUNCE_MS);
}
