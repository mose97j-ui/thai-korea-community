import type { Locale } from "@/lib/i18n/types";
import type { Post } from "./types";

function countScript(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

export function detectLocaleFromText(text: string): Locale {
  const sample = text.trim();
  if (!sample) {
    return "th";
  }

  const hangul = countScript(sample, /[\uAC00-\uD7AF]/g);
  const thai = countScript(sample, /[\u0E00-\u0E7F]/g);

  if (hangul > thai) {
    return "ko";
  }
  if (thai > hangul) {
    return "th";
  }

  return "th";
}

export function detectPostSourceLocale(post: Pick<Post, "storeName" | "title" | "content">): Locale {
  const combined = [post.storeName, post.title, post.content].filter(Boolean).join("\n");
  return detectLocaleFromText(combined);
}
