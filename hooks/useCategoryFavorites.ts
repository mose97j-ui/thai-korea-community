"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCategoryFavorites,
  toggleCategoryFavorite,
} from "@/lib/categories/favorites";

export function useCategoryFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }
    setFavorites(getCategoryFavorites(userId));
  }, [userId]);

  const toggle = useCallback(
    (categoryId: string) => {
      if (!userId) {
        return;
      }
      setFavorites(toggleCategoryFavorite(userId, categoryId));
    },
    [userId]
  );

  const isFavorite = useCallback(
    (categoryId: string) => favorites.includes(categoryId),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
