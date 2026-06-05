import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type DeleteBody = {
  ids?: string[];
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true, deleted: 0, meta: { configured: false } });
  }

  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const ids = (body.ids ?? []).filter((id) => typeof id === "string" && id.length > 0);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "No post ids." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("posts").delete().in("id", ids);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ ok: false, error: messageText }, { status: 500 });
  }
}
