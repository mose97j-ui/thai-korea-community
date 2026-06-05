"use client";

import type { Post } from "@/lib/posts/types";
import { postRowToPost, type PostRow } from "@/lib/supabase/posts";
import { tryCreateClient } from "@/utils/supabase/client";

export async function fetchAllPostsClient(limit = 1500): Promise<Post[]> {
  const supabase = tryCreateClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as PostRow[]).map(postRowToPost);
}
