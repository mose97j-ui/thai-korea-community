"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCategoryRegistryVersion } from "@/contexts/CategoryRegistryContext";
import CategoryPostForm from "@/components/CategoryPostForm";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PremiumGate from "@/components/PremiumGate";
import { Card } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { isAdminUser, isOperatorUser } from "@/lib/auth/operator";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { getPostFormTemplate } from "@/lib/posts/formTemplates";

type WritePageProps = {
  params: Promise<{ categoryId: string; subId: string }>;
};

export default function CategoryWritePage({ params }: WritePageProps) {
  const router = useRouter();
  const { t, pick } = useLocale();
  const { user, isReady } = useAuth();
  const [route, setRoute] = useState<{ categoryId: string; subId: string } | null>(
    null
  );
  const menuVersion = useCategoryRegistryVersion();

  useEffect(() => {
    void params.then(setRoute);
  }, [params]);

  const category = useMemo(
    () => (route ? getHomeCategoryById(route.categoryId) : undefined),
    [route, menuVersion]
  );
  const subItem = useMemo(
    () =>
      route ? getSubCategoryItem(route.categoryId, route.subId) : undefined,
    [route, menuVersion]
  );

  useEffect(() => {
    if (isReady && !user && route) {
      router.replace(
        `/login?next=${encodeURIComponent(
          `/c/${route.categoryId}/${route.subId}/write`
        )}`
      );
    }
  }, [isReady, user, route, router]);

  if (!route) {
    return (
      <PageShell maxWidth="full">
        <Card className="py-10 text-center text-base text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  const template = getPostFormTemplate(route.categoryId);

  if (!category || !subItem) {
    notFound();
  }

  if (!isReady || !user) {
    return null;
  }

  if (
    route.categoryId === "ideas" &&
    !isOperatorUser(user) &&
    !isAdminUser(user)
  ) {
    notFound();
  }

  return (
    <PageShell maxWidth="full">
      <PremiumGate categoryId={route.categoryId}>
        <PageHeader
          compact
          title={t("post.write")}
          backHref={`/c/${route.categoryId}/${route.subId}`}
          backLabel={t("post.backToBoard")}
        />

        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-2xl ${subItem.tint} ring-1 ring-black/[0.04]`}
            >
              {subItem.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {pick(category.label)} · {pick(subItem.title)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {t(template.hintKey)}
              </p>
            </div>
          </div>
        </Card>

        <CategoryPostForm
          categoryId={route.categoryId}
          subId={route.subId}
        />

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link
            href={`/c/${route.categoryId}/${route.subId}`}
            className="text-[#06C755]"
          >
            {t("post.backToBoard")}
          </Link>
        </p>
      </PremiumGate>
    </PageShell>
  );
}
