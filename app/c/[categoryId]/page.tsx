"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCategoryRegistryVersion } from "@/contexts/CategoryRegistryContext";
import CategoryBoard from "@/components/CategoryBoard";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PremiumGate from "@/components/PremiumGate";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getHomeCategoryById,
  getCategorySubItems,
} from "@/lib/categories/registry";
import { isPlaceBasedCategory } from "@/lib/posts/formTemplates";

type CategoryOverviewProps = {
  params: Promise<{ categoryId: string }>;
};

export default function CategoryOverviewPage({ params }: CategoryOverviewProps) {
  const { t, pick } = useLocale();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const menuVersion = useCategoryRegistryVersion();

  useEffect(() => {
    void params.then((route) => setCategoryId(route.categoryId));
  }, [params]);

  const category = useMemo(
    () => (categoryId ? getHomeCategoryById(categoryId) : undefined),
    [categoryId, menuVersion]
  );
  const subItems = useMemo(
    () => (categoryId ? getCategorySubItems(categoryId) : []),
    [categoryId, menuVersion]
  );

  if (!categoryId) {
    return (
      <PageShell maxWidth="full">
        <Card className="py-10 text-center text-base text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  const placeBased = isPlaceBasedCategory(categoryId);

  if (!category) {
    notFound();
  }

  const defaultWriteHref = subItems[0]
    ? `/c/${categoryId}/${subItems[0].id}/write`
    : `/c/${categoryId}`;

  return (
    <PageShell maxWidth="full">
      <PremiumGate categoryId={categoryId}>
        <PageHeader
          compact
          title={pick(category.label)}
          backHref="/"
          backLabel={t("common.backHome")}
        />

        <Card className="mb-3">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[25px] text-4xl ${category.tint} ring-1 ring-black/[0.04]`}
            >
              {category.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {pick(category.label)}
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                {placeBased
                  ? t("post.placeBoardDesc")
                  : t("home.subcategoryCount").replace(
                      "{count}",
                      String(subItems.length)
                    )}
              </p>
            </div>
          </div>
        </Card>

        {placeBased ? (
          <Suspense
            fallback={
              <Card className="py-10 text-center text-base text-gray-500">
                {t("common.loading")}
              </Card>
            }
          >
            <CategoryBoard categoryId={categoryId} writeHref={defaultWriteHref} />
          </Suspense>
        ) : (
          <>
            <p className="section-label">{t("home.allSubcategories")}</p>
            <div className="social-menu-grid">
              {subItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex min-h-[11rem] flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.98] hover:ring-[#06C755]/30 sm:min-h-[12rem] sm:p-6"
                >
                  <div
                    className={`mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] text-3xl sm:mb-5 sm:h-24 sm:w-24 sm:rounded-[25px] sm:text-4xl ${item.tint} shadow-sm ring-1 ring-black/[0.04] transition group-hover:scale-105`}
                  >
                    {item.icon}
                  </div>
                  <p className="text-ui-title line-clamp-2 text-base sm:text-lg">
                    {pick(item.title)}
                  </p>
                  <p className="text-ui-body mt-2 line-clamp-3 text-sm sm:text-base">
                    {pick(item.description)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </PremiumGate>
    </PageShell>
  );
}
