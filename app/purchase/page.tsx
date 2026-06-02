"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import { Card, SectionLabel, compactLinkGridClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { homeCategoryItems } from "@/lib/i18n/content";

export default function PurchasePage() {
  const { t, pick } = useLocale();

  return (
    <PageShell maxWidth="full">
      <PageHeader compact title={t("purchase.title")} />

      <Card className="mb-4">
        <p className="text-sm leading-relaxed text-gray-600">{t("purchase.intro")}</p>
      </Card>

      <SectionLabel>{t("common.category")}</SectionLabel>
      <div className={compactLinkGridClassName}>
        {homeCategoryItems.purchase.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.99] active:bg-gray-50"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-2xl ${item.tint} ring-1 ring-black/[0.04]`}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {pick(item.title)}
              </p>
            </div>
            <span className="text-sm text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
