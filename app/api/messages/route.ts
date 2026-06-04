import { NextResponse } from "next/server";
import {
  listDirectMessagesForGmail,
  messageRowToDirectMessage,
} from "@/lib/supabase/directMessages";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gmail = searchParams.get("gmail")?.trim().toLowerCase();

  if (!gmail) {
    return NextResponse.json(
      { messages: [], meta: { configured: false, error: "gmail required" } },
      { status: 400 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      messages: [],
      meta: { configured: false },
    });
  }

  try {
    const supabase = createAdminClient();
    const rows = await listDirectMessagesForGmail(supabase, gmail);
    const messages = rows.map(messageRowToDirectMessage);

    return NextResponse.json({
      messages,
      meta: { configured: true, count: messages.length },
    });
  } catch {
    return NextResponse.json({
      messages: [],
      meta: { configured: true, count: 0 },
    });
  }
}
