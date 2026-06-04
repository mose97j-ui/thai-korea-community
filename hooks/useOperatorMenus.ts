"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryItem } from "@/lib/i18n/content";
import { categoryListSignature } from "@/lib/categories/categoryListSignature";
import {
  OPERATOR_MENUS_CHANGE_EVENT,
  getEffectiveHomeCategories,
} from "@/lib/categories/operatorMenus";

export function useOperatorMenus() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editCategories, setEditCategories] = useState<CategoryItem[]>([]);

  const refresh = useCallback(() => {
    const next = getEffectiveHomeCategories(false);
    const nextEdit = getEffectiveHomeCategories(true);
    const nextSig = categoryListSignature(next);
    const nextEditSig = categoryListSignature(nextEdit);

    setCategories((previous) =>
      categoryListSignature(previous) === nextSig ? previous : next
    );
    setEditCategories((previous) =>
      categoryListSignature(previous) === nextEditSig ? previous : nextEdit
    );
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(OPERATOR_MENUS_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener(OPERATOR_MENUS_CHANGE_EVENT, refresh);
    };
  }, [refresh]);

  return {
    operatorCategories: categories,
    operatorCategoriesForEdit: editCategories,
    refreshOperatorMenus: refresh,
  };
}
