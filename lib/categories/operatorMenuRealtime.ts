"use client";

import {
  applyRemoteOperatorMenuStore,
  type OperatorMenuStore,
} from "@/lib/categories/operatorMenus";
import { tryCreateClient } from "@/utils/supabase/client";

type SiteOperatorMenusRow = {
  id: string;
  payload: OperatorMenuStore;
  updated_at: string;
};

/** Supabase Realtime — menu changes propagate to all open tabs/devices. */
export function subscribeOperatorMenuChanges(onFetch: () => void): () => void {
  const supabase = tryCreateClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("site_operator_menus_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_operator_menus" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onFetch();
          return;
        }

        const row = payload.new as SiteOperatorMenusRow | null;
        if (row?.payload && row.updated_at) {
          applyRemoteOperatorMenuStore(row.payload, row.updated_at);
          return;
        }

        onFetch();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
