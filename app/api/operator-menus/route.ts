import { NextResponse } from "next/server";
import type { OperatorMenuStore } from "@/lib/categories/operatorMenus";
import { getSiteOperatorMenus } from "@/lib/supabase/siteOperatorMenus";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const emptyStore = (): OperatorMenuStore => ({
  categoryOverrides: {},
  subcategoryOverrides: {},
  addedCategories: [],
  addedSubcategories: [],
  categoryOrder: [],
  subcategoryOrder: {},
});

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ store: emptyStore(), updatedAt: null });
  }

  try {
    const supabase = createAdminClient();
    const row = await getSiteOperatorMenus(supabase);
    if (!row) {
      return NextResponse.json({ store: emptyStore(), updatedAt: null });
    }

    return NextResponse.json({
      store: row.payload ?? emptyStore(),
      updatedAt: row.updated_at,
    });
  } catch {
    return NextResponse.json({ store: emptyStore(), updatedAt: null });
  }
}
