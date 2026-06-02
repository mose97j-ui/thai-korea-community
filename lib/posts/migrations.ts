import { REVIEWS_CATEGORY_ID } from "@/lib/posts/placeReview";
import { deletePostsByCategory } from "@/lib/posts/storage";

const CLEAR_REVIEWS_MIGRATION_KEY = "tkc_migration_clear_reviews_posts_v1";

export function runPostMigrations(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (localStorage.getItem(CLEAR_REVIEWS_MIGRATION_KEY)) {
    return;
  }

  deletePostsByCategory(REVIEWS_CATEGORY_ID);
  localStorage.setItem(CLEAR_REVIEWS_MIGRATION_KEY, new Date().toISOString());
}
