import { NextResponse } from "next/server";
import type { Post } from "@/lib/posts/types";
import { upsertPost } from "@/lib/supabase/posts";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type SyncBody = {
  post?: Post;
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Post sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const post = body.post;
  if (!post?.id || !post.authorId || !post.categoryId || !post.subId) {
    return NextResponse.json({ ok: false, error: "Invalid post payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = await upsertPost(supabase, post);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: messageText }, { status: 500 });
  }
}
