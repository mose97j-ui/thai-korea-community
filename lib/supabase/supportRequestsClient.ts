"use client";

import type { SupportRequest } from "@/lib/support/types";
import {
  supportRowToRequest,
  type SupportRequestRow,
} from "@/lib/supabase/supportRequests";
import { tryCreateClient } from "@/utils/supabase/client";

export async function fetchSupportRequestsForGmailClient(
  gmail: string
): Promise<SupportRequest[]> {
  const supabase = tryCreateClient();
  if (!supabase) {
    return [];
  }

  const normalized = gmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .eq("user_gmail", normalized)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return (data as SupportRequestRow[]).map(supportRowToRequest);
}

export async function fetchAllSupportRequestsClient(): Promise<SupportRequest[]> {
  const supabase = tryCreateClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return (data as SupportRequestRow[]).map(supportRowToRequest);
}
