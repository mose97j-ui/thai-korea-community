"use client";

import type { DirectMessage } from "@/lib/social/types";
import {
  messageRowToDirectMessage,
  type DirectMessageRow,
} from "@/lib/supabase/directMessages";
import { tryCreateClient } from "@/utils/supabase/client";

export async function fetchDirectMessagesForGmailClient(
  gmail: string
): Promise<DirectMessage[]> {
  const supabase = tryCreateClient();
  if (!supabase) {
    return [];
  }

  const normalized = gmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`sender_gmail.eq.${normalized},recipient_gmail.eq.${normalized}`)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error || !data) {
    return [];
  }

  return (data as DirectMessageRow[]).map(messageRowToDirectMessage);
}
