"use client";

import { MEMBERS_SYNC_EVENT } from "@/lib/auth/memberSync";
import { mergeRemoteMembers } from "@/lib/auth/storage";
import {
  memberRowToUser,
  type MemberRegistryRow,
} from "@/lib/supabase/memberRegistry";
import { tryCreateClient } from "@/utils/supabase/client";

function notifyMembersChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(MEMBERS_SYNC_EVENT));
}

/** Subscribe to Supabase Realtime — operator UI updates within seconds. */
export function subscribeMemberRegistryChanges(
  onChange: () => void
): () => void {
  const supabase = tryCreateClient();
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("member_registry_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "member_registry" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onChange();
          notifyMembersChanged();
          return;
        }

        const row = payload.new as MemberRegistryRow | null;
        if (row?.id) {
          mergeRemoteMembers([memberRowToUser(row)]);
          notifyMembersChanged();
          return;
        }

        onChange();
        notifyMembersChanged();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
