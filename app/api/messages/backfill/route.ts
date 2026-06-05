import { NextResponse } from "next/server";
import type { DirectMessage } from "@/lib/social/types";
import { upsertDirectMessage } from "@/lib/supabase/directMessages";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BATCH = 120;

type BackfillItem = {
  message?: DirectMessage;
  senderGmail?: string;
  recipientGmail?: string;
};

type BackfillBody = {
  items?: BackfillItem[];
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Message sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: BackfillBody;
  try {
    body = (await request.json()) as BackfillBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_BATCH) : [];
  if (items.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, total: 0, skipped: 0 });
  }

  const supabase = createAdminClient();
  let synced = 0;
  let skipped = 0;

  for (const item of items) {
    const message = item.message;
    const senderGmail = item.senderGmail?.trim().toLowerCase();
    const recipientGmail = item.recipientGmail?.trim().toLowerCase();

    if (
      !message?.id ||
      !senderGmail ||
      !recipientGmail ||
      !senderGmail.endsWith("@gmail.com") ||
      !recipientGmail.endsWith("@gmail.com")
    ) {
      skipped += 1;
      continue;
    }

    const result = await upsertDirectMessage(
      supabase,
      message,
      senderGmail,
      recipientGmail
    );
    if (result.ok) {
      synced += 1;
    } else {
      skipped += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    synced,
    total: items.length,
    skipped,
  });
}
