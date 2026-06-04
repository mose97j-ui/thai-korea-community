import { NextResponse } from "next/server";
import type { OperatorMenuStore } from "@/lib/categories/operatorMenus";
import { upsertSiteOperatorMenus } from "@/lib/supabase/siteOperatorMenus";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

type SyncBody = {
  store?: OperatorMenuStore;
  operatorGmail?: string;
};

function getOperatorGmail(): string {
  return (process.env.NEXT_PUBLIC_OPERATOR_GMAIL || "mose97j@gmail.com").toLowerCase();
}

function isValidStore(store: OperatorMenuStore | undefined): store is OperatorMenuStore {
  if (!store || typeof store !== "object") {
    return false;
  }
  return (
    typeof store.categoryOverrides === "object" &&
    typeof store.subcategoryOverrides === "object" &&
    Array.isArray(store.addedCategories) &&
    Array.isArray(store.addedSubcategories)
  );
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Operator menu sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const operatorGmail = body.operatorGmail?.trim().toLowerCase();
  if (operatorGmail !== getOperatorGmail()) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!isValidStore(body.store)) {
    return NextResponse.json({ ok: false, error: "Invalid store" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const row = await upsertSiteOperatorMenus(supabase, body.store, operatorGmail);
    if (!row) {
      return NextResponse.json({ ok: false, error: "Upsert failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      updatedAt: row.updated_at,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
