import type { CategoryItem } from "@/lib/i18n/content";

/** Stable signature — skip React state updates when menu order/ids are unchanged. */
export function categoryListSignature(items: CategoryItem[]): string {
  return items.map((item) => item.id).join("\u0000");
}
