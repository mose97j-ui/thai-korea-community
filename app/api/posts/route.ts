import { NextResponse } from "next/server";
import { listPosts, postRowToPost } from "@/lib/supabase/posts";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ posts: [], meta: { configured: false } });
  }

  try {
    const supabase = createAdminClient();
    const rows = await listPosts(supabase);
    const posts = rows.map(postRowToPost);
    return NextResponse.json({ posts, meta: { configured: true, count: posts.length } });
  } catch {
    return NextResponse.json({ posts: [], meta: { configured: true, count: 0 } });
  }
}
