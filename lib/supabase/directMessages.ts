import type { SupabaseClient } from "@supabase/supabase-js";
import type { DirectMessage } from "@/lib/social/types";

export type DirectMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  sender_gmail: string;
  recipient_gmail: string;
  content: string;
  send_mode: "nickname" | "anonymous" | null;
  sender_display_name: string | null;
  images: string[] | null;
  video_url: string | null;
  related_post_id: string | null;
  read_at: string | null;
  created_at: string;
};

export function messageRowToDirectMessage(row: DirectMessageRow): DirectMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    sendMode: row.send_mode ?? undefined,
    senderDisplayName: row.sender_display_name ?? undefined,
    images: row.images ?? undefined,
    videoUrl: row.video_url ?? undefined,
    relatedPostId: row.related_post_id ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function directMessageToRow(message: DirectMessage, senderGmail: string, recipientGmail: string): DirectMessageRow {
  return {
    id: message.id,
    conversation_id: message.conversationId,
    sender_id: message.senderId,
    recipient_id: message.recipientId,
    sender_gmail: senderGmail.toLowerCase(),
    recipient_gmail: recipientGmail.toLowerCase(),
    content: message.content,
    send_mode: message.sendMode ?? null,
    sender_display_name: message.senderDisplayName ?? null,
    images: message.images?.length ? message.images : null,
    video_url: message.videoUrl ?? null,
    related_post_id: message.relatedPostId ?? null,
    read_at: message.readAt ?? null,
    created_at: message.createdAt,
  };
}

export async function upsertDirectMessage(
  supabase: SupabaseClient,
  message: DirectMessage,
  senderGmail: string,
  recipientGmail: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = directMessageToRow(message, senderGmail, recipientGmail);
  const { error } = await supabase.from("direct_messages").upsert(row, {
    onConflict: "id",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function listDirectMessagesForGmail(
  supabase: SupabaseClient,
  gmail: string,
  limit = 1000
): Promise<DirectMessageRow[]> {
  const normalized = gmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`sender_gmail.eq.${normalized},recipient_gmail.eq.${normalized}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as DirectMessageRow[];
}
