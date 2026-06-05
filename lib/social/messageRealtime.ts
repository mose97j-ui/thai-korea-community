"use client";

import { tryCreateClient } from "@/utils/supabase/client";

/** Supabase Realtime — new messages appear on operator/member inboxes. */
export function subscribeDirectMessageChanges(onChange: () => void): () => void {
  const supabase = tryCreateClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`direct_messages_live_${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_messages" },
      () => {
        onChange();
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "direct_messages" },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
