import { NextResponse } from "next/server";
import { listMemberRegistry, memberRowToUser } from "@/lib/supabase/memberRegistry";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ members: [] });
  }

  try {
    const supabase = createAdminClient();
    const rows = await listMemberRegistry(supabase);
    return NextResponse.json({
      members: rows.map(memberRowToUser),
    });
  } catch {
    return NextResponse.json({ members: [] });
  }
}
