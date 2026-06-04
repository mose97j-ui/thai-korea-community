import { NextResponse } from "next/server";
import {
  listAllSupportRequests,
  listSupportRequestsForGmail,
  supportRowToRequest,
} from "@/lib/supabase/supportRequests";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const gmail = searchParams.get("gmail")?.trim().toLowerCase();

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      requests: [],
      meta: { configured: false },
    });
  }

  if (scope !== "operator" && !gmail) {
    return NextResponse.json(
      { requests: [], meta: { configured: false, error: "gmail required" } },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const rows =
      scope === "operator"
        ? await listAllSupportRequests(supabase)
        : await listSupportRequestsForGmail(supabase, gmail!);
    const requests = rows.map(supportRowToRequest);

    return NextResponse.json({
      requests,
      meta: { configured: true, count: requests.length },
    });
  } catch {
    return NextResponse.json({
      requests: [],
      meta: { configured: true, count: 0 },
    });
  }
}
