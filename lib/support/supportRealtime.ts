"use client";

import { tryCreateClient } from "@/utils/supabase/client";

export function subscribeSupportRequestChanges(onChange: () => void): () => void {
  const supabase = tryCreateClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("support_requests_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "support_requests" },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
