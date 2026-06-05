import type { SupabaseClient } from "@supabase/supabase-js";
import type { Post } from "@/lib/posts/types";

export type PostRow = {
  id: string;
  category_id: string;
  sub_id: string;
  store_name: string;
  address: string;
  address_key: string;
  road_address: string | null;
  jibun_address: string | null;
  display_address: string | null;
  map_lat: number | null;
  map_lng: number | null;
  author_id: string;
  author_nickname: string;
  author_profile_image: string | null;
  title: string;
  content: string;
  directions: string | null;
  business_hours: string | null;
  images: string[] | null;
  video_url: string | null;
  source_locale: Post["sourceLocale"] | null;
  localized: Post["localized"] | null;
  is_secret: boolean;
  secret_password_hash: string | null;
  is_hidden_by_author: boolean;
  place_review: Post["placeReview"] | null;
  purchase_agency: Post["purchaseAgency"] | null;
  created_at: string;
  updated_at: string;
};

export function postRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    categoryId: row.category_id,
    subId: row.sub_id,
    storeName: row.store_name,
    address: row.address,
    addressKey: row.address_key,
    roadAddress: row.road_address ?? undefined,
    jibunAddress: row.jibun_address ?? undefined,
    displayAddress: row.display_address ?? undefined,
    mapLat: typeof row.map_lat === "number" ? row.map_lat : undefined,
    mapLng: typeof row.map_lng === "number" ? row.map_lng : undefined,
    authorId: row.author_id,
    authorNickname: row.author_nickname,
    authorProfileImage: row.author_profile_image ?? undefined,
    title: row.title,
    content: row.content,
    directions: row.directions ?? undefined,
    businessHours: row.business_hours ?? undefined,
    images: Array.isArray(row.images) ? row.images : [],
    videoUrl: row.video_url ?? undefined,
    sourceLocale: row.source_locale ?? undefined,
    localized: row.localized ?? undefined,
    isSecret: row.is_secret,
    secretPasswordHash: row.secret_password_hash ?? undefined,
    isHiddenByAuthor: row.is_hidden_by_author,
    placeReview: row.place_review ?? undefined,
    purchaseAgency: row.purchase_agency ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function postToRow(post: Post): PostRow {
  return {
    id: post.id,
    category_id: post.categoryId,
    sub_id: post.subId,
    store_name: post.storeName,
    address: post.address,
    address_key: post.addressKey,
    road_address: post.roadAddress ?? null,
    jibun_address: post.jibunAddress ?? null,
    display_address: post.displayAddress ?? null,
    map_lat: typeof post.mapLat === "number" ? post.mapLat : null,
    map_lng: typeof post.mapLng === "number" ? post.mapLng : null,
    author_id: post.authorId,
    author_nickname: post.authorNickname,
    author_profile_image: post.authorProfileImage ?? null,
    title: post.title,
    content: post.content,
    directions: post.directions ?? null,
    business_hours: post.businessHours ?? null,
    images: post.images ?? [],
    video_url: post.videoUrl ?? null,
    source_locale: post.sourceLocale ?? null,
    localized: post.localized ?? null,
    is_secret: Boolean(post.isSecret),
    secret_password_hash: post.secretPasswordHash ?? null,
    is_hidden_by_author: Boolean(post.isHiddenByAuthor),
    place_review: post.placeReview ?? null,
    purchase_agency: post.purchaseAgency ?? null,
    created_at: post.createdAt,
    updated_at: post.updatedAt ?? post.createdAt,
  };
}

export async function upsertPost(
  supabase: SupabaseClient,
  post: Post
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = postToRow(post);
  const { error } = await supabase.from("posts").upsert(row, { onConflict: "id" });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function listPosts(supabase: SupabaseClient, limit = 1500): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }
  return data as PostRow[];
}
