"use client";

import { tryCreateClient } from "@/utils/supabase/client";

export function subscribePostChanges(onChange: () => void): () => void {
  const supabase = tryCreateClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`posts_live_${Date.now()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
      onChange();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
