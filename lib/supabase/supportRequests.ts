import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportRequest } from "@/lib/support/types";

export type SupportRequestRow = {
  id: string;
  user_id: string;
  user_gmail: string;
  user_nickname: string;
  user_profile_image: string | null;
  category: SupportRequest["category"];
  title: string;
  status: SupportRequest["status"];
  messages: SupportRequest["messages"];
  unread_by_user: boolean;
  unread_by_operator: boolean;
  created_at: string;
  updated_at: string;
};

export function supportRowToRequest(row: SupportRequestRow): SupportRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userGmail: row.user_gmail,
    userNickname: row.user_nickname,
    userProfileImage: row.user_profile_image ?? undefined,
    category: row.category,
    title: row.title,
    status: row.status,
    messages: Array.isArray(row.messages) ? row.messages : [],
    unreadByUser: row.unread_by_user,
    unreadByOperator: row.unread_by_operator,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function supportRequestToRow(request: SupportRequest): SupportRequestRow {
  return {
    id: request.id,
    user_id: request.userId,
    user_gmail: request.userGmail.trim().toLowerCase(),
    user_nickname: request.userNickname,
    user_profile_image: request.userProfileImage ?? null,
    category: request.category,
    title: request.title,
    status: request.status,
    messages: request.messages,
    unread_by_user: request.unreadByUser,
    unread_by_operator: request.unreadByOperator,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  };
}

export async function upsertSupportRequest(
  supabase: SupabaseClient,
  request: SupportRequest
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = supportRequestToRow(request);
  const { error } = await supabase.from("support_requests").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function listSupportRequestsForGmail(
  supabase: SupabaseClient,
  gmail: string,
  limit = 300
): Promise<SupportRequestRow[]> {
  const normalized = gmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .eq("user_gmail", normalized)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as SupportRequestRow[];
}

export async function listAllSupportRequests(
  supabase: SupabaseClient,
  limit = 500
): Promise<SupportRequestRow[]> {
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as SupportRequestRow[];
}
