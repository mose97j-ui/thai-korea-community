"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  ensurePostLocalized,
  getPostDisplayFields,
  getPostSourceLocale,
} from "@/lib/posts/localize";
import type { Post, PostLocalizedText } from "@/lib/posts/types";

export function useLocalizedPost(post: Post) {
  const { locale } = useLocale();
  const sourceLocale = getPostSourceLocale(post);
  const isTranslatedView = locale !== sourceLocale;

  const [display, setDisplay] = useState<PostLocalizedText>(() =>
    getPostDisplayFields(post, locale)
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setTranslationError(false);

      if (locale === sourceLocale) {
        setDisplay(getPostDisplayFields(post, locale));
        setIsTranslating(false);
        return;
      }

      const cached = post.localized?.[locale];
      if (cached?.content.trim()) {
        setDisplay(cached);
        setIsTranslating(false);
        return;
      }

      setDisplay(getPostDisplayFields(post, locale));
      setIsTranslating(true);

      try {
        const translated = await ensurePostLocalized(post, locale);
        if (!cancelled) {
          setDisplay(translated);
        }
      } catch {
        if (!cancelled) {
          setTranslationError(true);
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [post, locale, sourceLocale]);

  return {
    display,
    isTranslating,
    isTranslatedView,
    translationError,
  };
}
