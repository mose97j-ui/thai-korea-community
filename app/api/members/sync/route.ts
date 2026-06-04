import { NextResponse } from "next/server";
import {
  isOperatorSyncRequest,
  parseSyncBody,
  type SyncMemberBody,
} from "@/lib/auth/syncMemberBody";
import { publishMemberToDirectory } from "@/lib/supabase/publishMember";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Member sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncMemberBody;
  try {
    body = (await request.json()) as SyncMemberBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const operatorSync = isOperatorSyncRequest(body);
  const user = parseSyncBody(body, operatorSync);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid member payload." }, { status: 400 });
  }

  try {
    const result = await publishMemberToDirectory(user, {
      mirrorProfile: operatorSync || user.authProvider === "google",
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
