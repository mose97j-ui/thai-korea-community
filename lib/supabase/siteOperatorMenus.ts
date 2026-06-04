import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperatorMenuStore } from "@/lib/categories/operatorMenus";

export type SiteOperatorMenusRow = {
  id: string;
  payload: OperatorMenuStore;
  updated_at: string;
  updated_by: string | null;
};

const ROW_ID = "default";

export async function getSiteOperatorMenus(
  supabase: SupabaseClient
): Promise<SiteOperatorMenusRow | null> {
  const { data, error } = await supabase
    .from("site_operator_menus")
    .select("id, payload, updated_at, updated_by")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SiteOperatorMenusRow;
}

export async function upsertSiteOperatorMenus(
  supabase: SupabaseClient,
  payload: OperatorMenuStore,
  updatedBy?: string
): Promise<SiteOperatorMenusRow | null> {
  const { data, error } = await supabase
    .from("site_operator_menus")
    .upsert({
      id: ROW_ID,
      payload,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("id, payload, updated_at, updated_by")
    .single();

  if (error || !data) {
    return null;
  }

  return data as SiteOperatorMenusRow;
}
