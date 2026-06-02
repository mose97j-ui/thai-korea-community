"use client";

import { useCallback, useEffect, useState } from "react";
import {
  USER_MENUS_CHANGE_EVENT,
  getUserCategories,
  type StoredUserCategory,
} from "@/lib/categories/userMenus";

export function useUserMenus() {
  const [categories, setCategories] = useState<StoredUserCategory[]>([]);

  const refresh = useCallback(() => {
    setCategories(getUserCategories());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(USER_MENUS_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(USER_MENUS_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return { userCategories: categories, refreshUserMenus: refresh };
}
