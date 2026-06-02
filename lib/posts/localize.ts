import type { Locale } from "@/lib/i18n/types";
import { translatePostFields } from "@/lib/translate/service";
import { detectPostSourceLocale } from "./detectLocale";
import {
  getPostSourceFields,
  updatePostLocalization,
} from "./storage";
import type { Post, PostLocalizedText } from "./types";

export function getPostSourceLocale(post: Post): Locale {
  return post.sourceLocale ?? detectPostSourceLocale(post);
}

export function getCachedLocalizedPost(
  post: Post,
  locale: Locale
): PostLocalizedText | null {
  const sourceLocale = getPostSourceLocale(post);
  if (locale === sourceLocale) {
    return getPostSourceFields(post);
  }

  const cached = post.localized?.[locale];
  if (cached?.content.trim()) {
    return cached;
  }

  return null;
}

export function getPostDisplayFields(
  post: Post,
  locale: Locale
): PostLocalizedText {
  return getCachedLocalizedPost(post, locale) ?? getPostSourceFields(post);
}

export async function ensurePostLocalized(
  post: Post,
  locale: Locale
): Promise<PostLocalizedText> {
  const sourceLocale = getPostSourceLocale(post);
  const sourceFields = getPostSourceFields(post);

  if (locale === sourceLocale) {
    return sourceFields;
  }

  const cached = post.localized?.[locale];
  if (cached?.content.trim()) {
    return cached;
  }

  const translated = await translatePostFields(sourceFields, sourceLocale, locale);
  updatePostLocalization(post.id, locale, translated);
  return translated;
}
