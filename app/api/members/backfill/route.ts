import { NextResponse } from "next/server";
import { parseSyncBody, type SyncMemberBody } from "@/lib/auth/syncMemberBody";
import { publishMemberToDirectory } from "@/lib/supabase/publishMember";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const MAX_BATCH = 80;

type BackfillBody = {
  members?: SyncMemberBody[];
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Member sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: BackfillBody;
  try {
    body = (await request.json()) as BackfillBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body.members) ? body.members.slice(0, MAX_BATCH) : [];
  if (items.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, total: 0, skipped: 0 });
  }

  let synced = 0;
  let skipped = 0;

  for (const item of items) {
    const user = parseSyncBody(item, false);
    if (!user) {
      skipped += 1;
      continue;
    }

    try {
      const result = await publishMemberToDirectory(user, {
        mirrorProfile: user.authProvider === "google",
      });
      if (result.ok) {
        synced += 1;
      } else {
        skipped += 1;
      }
    } catch {
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
