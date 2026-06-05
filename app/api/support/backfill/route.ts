import { NextResponse } from "next/server";
import type { SupportRequest } from "@/lib/support/types";
import { upsertSupportRequest } from "@/lib/supabase/supportRequests";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BATCH = 80;

type BackfillBody = {
  requests?: SupportRequest[];
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Support sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: BackfillBody;
  try {
    body = (await request.json()) as BackfillBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const requests = Array.isArray(body.requests) ? body.requests.slice(0, MAX_BATCH) : [];
  if (requests.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, total: 0, skipped: 0 });
  }

  const supabase = createAdminClient();
  let synced = 0;
  let skipped = 0;

  for (const request of requests) {
    const gmail = request.userGmail?.trim().toLowerCase();
    if (!request.id || !gmail || !gmail.endsWith("@gmail.com")) {
      skipped += 1;
      continue;
    }

    const result = await upsertSupportRequest(supabase, request);
    if (result.ok) {
      synced += 1;
    } else {
      skipped += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    synced,
    total: requests.length,
    skipped,
  });
}
