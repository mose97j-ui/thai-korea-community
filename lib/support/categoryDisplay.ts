import type { MessageKey } from "@/lib/i18n/messages";
import type { SupportCategory } from "./types";

export function supportCategoryLabelKey(category: SupportCategory): MessageKey {
  switch (category) {
    case "board":
      return "support.catBoard";
    case "feature":
      return "support.catFeature";
    case "qa":
      return "support.catQa";
    default:
      return "support.catOther";
  }
}

export function supportCategoryIcon(category: SupportCategory): string {
  switch (category) {
    case "board":
      return "📋";
    case "feature":
      return "✨";
    case "qa":
      return "❓";
    default:
      return "📝";
  }
}
