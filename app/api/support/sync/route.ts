import { NextResponse } from "next/server";
import type { SupportRequest } from "@/lib/support/types";
import { upsertSupportRequest } from "@/lib/supabase/supportRequests";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type SyncBody = {
  request?: SupportRequest;
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Support sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const item = body.request;
  const gmail = item?.userGmail?.trim().toLowerCase();

  if (!item?.id || !gmail || !gmail.endsWith("@gmail.com")) {
    return NextResponse.json({ ok: false, error: "Invalid support payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = await upsertSupportRequest(supabase, item);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: messageText }, { status: 500 });
  }
}
