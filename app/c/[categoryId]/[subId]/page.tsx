"use client";

import { notFound } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CategoryBoard from "@/components/CategoryBoard";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PremiumGate from "@/components/PremiumGate";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getHomeCategoryById,
  getSubCategoryItem,
  getCategorySubItems,
} from "@/lib/categories/registry";
import { isPlaceBasedCategory } from "@/lib/posts/formTemplates";

type CategoryPageProps = {
  params: Promise<{ categoryId: string; subId: string }>;
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const { t, pick } = useLocale();
  const [route, setRoute] = useState<{ categoryId: string; subId: string } | null>(
    null
  );

  useEffect(() => {
    void params.then(setRoute);
  }, [params]);

  if (!route) {
    return (
      <PageShell>
        <Card className="py-10 text-center text-base text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  const category = getHomeCategoryById(route.categoryId);
  const subItem = getSubCategoryItem(route.categoryId, route.subId);

  if (!category || !subItem) {
    notFound();
  }

  const writeHref = `/c/${route.categoryId}/${route.subId}/write`;

  return (
    <PageShell maxWidth="full">
      <PremiumGate categoryId={route.categoryId}>
        <PageHeader
          compact
          title={pick(subItem.title)}
          backHref="/"
          backLabel={t("common.backHome")}
        />

        <Card className="mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-2xl ${subItem.tint} ring-1 ring-black/[0.04]`}
            >
              {subItem.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {pick(category.label)}
              </p>
              <p className="mt-0.5 text-base leading-relaxed text-gray-600">
                {pick(subItem.description)}
              </p>
            </div>
          </div>
        </Card>

        <Suspense
          fallback={
            <Card className="py-10 text-center text-base text-gray-500">
              {t("common.loading")}
            </Card>
          }
        >
          <CategoryBoard
            categoryId={route.categoryId}
            subId={route.subId}
            writeHref={writeHref}
          />
        </Suspense>
      </PremiumGate>
    </PageShell>
  );
}
