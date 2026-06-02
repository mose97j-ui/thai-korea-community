"use client";

import Link from "next/link";
import { FeedSection, ListItem } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import type { MessageKey } from "@/lib/i18n/messages";

const checklistItems: { key: MessageKey; href: string; icon: string }[] = [
  { key: "operator.previewCheckBrowse", href: "/", icon: "🏠" },
  { key: "operator.previewCheckEngage", href: "/c/reviews/reviews-0", icon: "👍" },
  { key: "operator.previewCheckMessage", href: "/messages", icon: "💬" },
  { key: "operator.previewCheckReport", href: "/c/reviews/reviews-0", icon: "🚩" },
  { key: "operator.previewCheckSupport", href: "/support/new", icon: "📮" },
  { key: "operator.previewCheckPremium", href: "/premium", icon: "👑" },
  { key: "operator.previewCheckSearch", href: "/search", icon: "🔍" },
];

export default function OperatorPreviewChecklist() {
  const { t } = useLocale();
  const { viewAsUser } = useOperatorView();

  if (!viewAsUser) {
    return null;
  }

  return (
    <FeedSection
      tone="amber"
      icon="✅"
      title={t("operator.previewChecklistTitle")}
      description={t("operator.previewChecklistDesc")}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {checklistItems.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="block">
              <ListItem className="transition hover:bg-amber-50/90 hover:ring-amber-200/50 active:scale-[0.99]">
                <span className="flex items-start gap-3">
                  <span className="text-xl" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-ui-body min-w-0 flex-1 text-sm text-[#050505]">
                    {t(item.key)}
                  </span>
                </span>
              </ListItem>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-ui-caption mt-4 border-t border-black/[0.06] pt-3">
        {t("operator.previewChecklistNote")}
      </p>
    </FeedSection>
  );
}
