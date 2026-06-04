import { NextResponse } from "next/server";
import type { DirectMessage } from "@/lib/social/types";
import { upsertDirectMessage } from "@/lib/supabase/directMessages";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type SyncBody = {
  message?: DirectMessage;
  senderGmail?: string;
  recipientGmail?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Message sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message;
  const senderGmail = body.senderGmail?.trim().toLowerCase();
  const recipientGmail = body.recipientGmail?.trim().toLowerCase();

  if (!message?.id || !senderGmail || !recipientGmail) {
    return NextResponse.json({ ok: false, error: "Invalid message payload." }, { status: 400 });
  }

  if (!senderGmail.endsWith("@gmail.com") || !recipientGmail.endsWith("@gmail.com")) {
    return NextResponse.json({ ok: false, error: "Gmail addresses only." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = await upsertDirectMessage(
      supabase,
      message,
      senderGmail,
      recipientGmail
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: messageText }, { status: 500 });
  }
}
