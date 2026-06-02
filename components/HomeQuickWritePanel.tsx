"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CategoryPostForm from "@/components/CategoryPostForm";
import PremiumPaywall from "@/components/PremiumPaywall";
import { Card, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import {
  getAllHomeCategories,
  getCategorySubItems,
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { isPremiumCategoryId } from "@/lib/categories/registry";
import { getPostFormTemplate } from "@/lib/posts/formTemplates";

type HomeQuickWritePanelProps = {
  categoryId: string;
  subId: string;
  onCategoryChange: (categoryId: string, subId: string) => void;
};

export default function HomeQuickWritePanel({
  categoryId,
  subId,
  onCategoryChange,
}: HomeQuickWritePanelProps) {
  const router = useRouter();
  const { t, pick } = useLocale();
  const { hasAccess: hasPremiumAccess } = usePremiumAccess();
  const [expanded, setExpanded] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const category = getHomeCategoryById(categoryId);
  const subItem = getSubCategoryItem(categoryId, subId);
  const subItems = getCategorySubItems(categoryId);
  const template = getPostFormTemplate(categoryId);
  const lockedPremium = isPremiumCategoryId(categoryId) && !hasPremiumAccess;
  const premiumCategory = getHomeCategoryById("premium");

  const writableCategories = useMemo(
    () =>
      getAllHomeCategories().filter(
        (item) => !item.premium || hasPremiumAccess
      ),
    [hasPremiumAccess]
  );

  useEffect(() => {
    setSuccessMessage("");
  }, [categoryId, subId]);

  const handleCategoryPick = (nextCategoryId: string) => {
    const nextSubItems = getCategorySubItems(nextCategoryId);
    const nextSubId = nextSubItems[0]?.id ?? `${nextCategoryId}-0`;
    onCategoryChange(nextCategoryId, nextSubId);
  };

  const handlePostSuccess = (result: { categoryId: string; subId: string }) => {
    setSuccessMessage(t("home.writeSuccess"));
    setFormVersion((version) => version + 1);
    router.push(`/c/${result.categoryId}/${result.subId}`);
  };

  return (
    <Card className="mb-3 overflow-hidden !p-0">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="flex w-full items-center justify-center gap-3 bg-white px-6 py-5 text-lg font-semibold text-gray-900 transition hover:bg-[#06C755]/5 hover:text-[#06C755] active:bg-[#06C755]/10"
        >
          <span className="text-xl" aria-hidden>
            ✏️
          </span>
          <span>{t("home.quickWrite")}</span>
          <span className="text-base text-gray-400" aria-hidden>
            ▾
          </span>
        </button>
      ) : (
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900">{t("home.quickWrite")}</p>
              <p className="mt-1 text-sm text-gray-500">{t("home.quickWriteDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-expanded
              className="shrink-0 rounded-full bg-[#F0F2F5] px-3 py-1.5 text-sm font-semibold text-gray-600 ring-1 ring-black/[0.06] transition hover:bg-gray-100"
            >
              {t("home.quickWriteClose")} ▴
            </button>
          </div>
        </div>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-gray-100 px-5 pb-5 pt-4">
            <div className="rounded-2xl bg-[#F8F9FA] p-4 ring-1 ring-black/[0.04]">
              <SectionLabel>{t("home.selectCategory")}</SectionLabel>
              <div className="mt-3 space-y-2">
                {writableCategories.map((item) => {
                  const active = item.id === categoryId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCategoryPick(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition active:scale-[0.99] ${
                        active
                          ? "bg-[#06C755] text-white shadow-sm ring-2 ring-[#06C755]/30"
                          : "bg-white text-gray-900 ring-1 ring-black/[0.06] hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl ${
                          active ? "bg-white/20" : item.tint
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 text-base font-semibold">
                        {pick(item.label)}
                      </span>
                      {active && (
                        <span className="shrink-0 text-sm font-bold text-white/90">✓</span>
                      )}
                    </button>
                  );
                })}
                {!hasPremiumAccess && premiumCategory && (
                  <button
                    type="button"
                    onClick={() => handleCategoryPick("premium")}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition active:scale-[0.99] ${
                      categoryId === "premium"
                        ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40"
                        : "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl ${
                        categoryId === "premium" ? "bg-white/20" : premiumCategory.tint
                      }`}
                    >
                      👑
                    </span>
                    <span className="min-w-0 flex-1 text-base font-semibold">
                      {pick(premiumCategory.label)}
                    </span>
                    <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">
                      🔒
                    </span>
                  </button>
                )}
              </div>
            </div>

            {category && subItems.length > 0 && (
              <div className="rounded-2xl bg-[#F8F9FA] p-4 ring-1 ring-black/[0.04]">
                <SectionLabel>{t("home.selectSubcategory")}</SectionLabel>
                <div className="mt-3 space-y-2">
                  {subItems.map((item) => {
                    const active = item.id === subId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onCategoryChange(categoryId, item.id)}
                        className={`flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left transition active:scale-[0.99] ${
                          active
                            ? "bg-white text-gray-900 shadow-sm ring-2 ring-[#06C755]"
                            : "bg-white/70 text-gray-800 ring-1 ring-black/[0.05] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${item.tint}`}
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-gray-900">
                            {pick(item.title)}
                          </span>
                          <span className="mt-0.5 block text-sm leading-snug text-gray-500">
                            {pick(item.description)}
                          </span>
                        </span>
                        {active && (
                          <span className="shrink-0 pt-0.5 text-sm font-bold text-[#06C755]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {category && subItem && !lockedPremium && (
              <div className="rounded-2xl border border-[#06C755]/15 bg-[#06C755]/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#06C755]">
                  {pick(category.label)} · {pick(subItem.title)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {t(template.hintKey)}
                </p>
              </div>
            )}

            {successMessage && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                {successMessage}
              </p>
            )}

            {lockedPremium ? (
              <PremiumPaywall variant="inline" />
            ) : category && subItem ? (
              <CategoryPostForm
                key={`${categoryId}-${subId}-${formVersion}`}
                categoryId={categoryId}
                subId={subId}
                compact
                embedded
                showHeader={false}
                onSuccess={handlePostSuccess}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
