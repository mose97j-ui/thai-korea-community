"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryItem } from "@/lib/i18n/content";
import {
  OPERATOR_MENUS_CHANGE_EVENT,
  getEffectiveHomeCategories,
} from "@/lib/categories/operatorMenus";

export function useOperatorMenus() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editCategories, setEditCategories] = useState<CategoryItem[]>([]);

  const refresh = useCallback(() => {
    setCategories(getEffectiveHomeCategories(false));
    setEditCategories(getEffectiveHomeCategories(true));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(OPERATOR_MENUS_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(OPERATOR_MENUS_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return {
    operatorCategories: categories,
    operatorCategoriesForEdit: editCategories,
    refreshOperatorMenus: refresh,
  };
}
