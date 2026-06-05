"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { MEMBERS_SYNC_EVENT } from "@/lib/auth/memberSync";
import {
  buildOperatorAnalytics,
  type OperatorAnalytics,
  type StatRow,
} from "@/lib/admin/analytics";
import { getAllHomeCategories } from "@/lib/categories/registry";

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-[#F0F2F5] px-3 py-3 ring-1 ring-black/[0.06]">
      <p className="truncate text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold leading-tight ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function DistributionSection({
  title,
  rows,
  emptyLabel,
  compact = false,
}: {
  title: string;
  rows: StatRow[];
  emptyLabel: string;
  compact?: boolean;
}) {
  return (
    <Card className={`h-full ${compact ? "p-4" : "p-5"}`}>
      <SectionLabel>{title}</SectionLabel>
      {rows.length === 0 ? (
        <p className="px-1 text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <div className={compact ? "space-y-2" : "space-y-3"}>
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-semibold text-gray-900">
                  {row.label}
                </span>
                <span className="shrink-0 text-gray-500">
                  {row.count} ({row.percent}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#06C755] transition-all"
                  style={{ width: `${Math.max(row.percent, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function OperatorAnalyticsPanel() {
  const { t, pick, locale } = useLocale();
  const [payments, setPayments] = useState<OperatorAnalytics["payments"]>(null);
  const [membersVersion, setMembersVersion] = useState(0);

  useEffect(() => {
    const bump = () => setMembersVersion((value) => value + 1);
    window.addEventListener(MEMBERS_SYNC_EVENT, bump);
    return () => window.removeEventListener(MEMBERS_SYNC_EVENT, bump);
  }, []);

  const labelPack = useMemo(() => {
    const categoryLabels = Object.fromEntries(
      getAllHomeCategories().map((category) => [category.id, pick(category.label)])
    );

    return {
      gender: {
        male: t("admin.genderMale"),
        female: t("admin.genderFemale"),
        unknown: t("admin.genderUnknown"),
      },
      age: {
        "18-24": t("admin.age1824"),
        "25-29": t("admin.age2529"),
        "30-39": t("admin.age3039"),
        "40-49": t("admin.age4049"),
        "50+": t("admin.age50plus"),
      },
      membership: {
        premiumActive: t("admin.membershipPremiumActive"),
        premiumExpired: t("admin.membershipPremiumExpired"),
        free: t("admin.membershipFree"),
      },
      monthUnknown: t("admin.monthUnknown"),
      hometownUnknown: t("admin.hometownUnknown"),
      categoryLabels,
    };
  }, [t, pick]);

  const refreshPayments = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/payment-stats");
      if (!response.ok) {
        setPayments(null);
        return;
      }
      setPayments(await response.json());
    } catch {
      setPayments(null);
    }
  }, []);

  useEffect(() => {
    void refreshPayments();
    window.addEventListener("focus", refreshPayments);
    return () => window.removeEventListener("focus", refreshPayments);
  }, [refreshPayments]);

  const analytics = useMemo(
    () => buildOperatorAnalytics(labelPack, payments),
    [labelPack, payments, membersVersion]
  );

  const formatMonth = (key: string) => {
    if (key === "unknown") {
      return t("admin.monthUnknown");
    }
    const [year, month] = key.split("-");
    if (!year || !month) {
      return key;
    }
    return locale === "ko"
      ? `${year}년 ${Number(month)}월`
      : `${month}/${year}`;
  };

  const signupsByMonth = analytics.signupsByMonth.map((row) => ({
    ...row,
    label: formatMonth(row.key),
  }));

  const summaryItems = [
    { label: t("admin.totalMembers"), value: analytics.summary.totalMembers },
    {
      label: t("admin.totalOperators"),
      value: analytics.summary.totalOperators,
      accent: "text-sky-600",
    },
    {
      label: t("admin.totalAdmins"),
      value: analytics.summary.totalAdmins,
      accent: "text-violet-600",
    },
    {
      label: t("admin.premiumActive"),
      value: analytics.summary.premiumActive,
      accent: "text-amber-600",
    },
    { label: t("admin.freeMembers"), value: analytics.summary.freeMembers },
    {
      label: t("admin.recentSignups7d"),
      value: analytics.summary.recentSignups7d,
      accent: "text-[#06C755]",
    },
    { label: t("admin.maleCount"), value: analytics.summary.maleCount },
    { label: t("admin.femaleCount"), value: analytics.summary.femaleCount },
    { label: t("admin.withReferral"), value: analytics.summary.withReferral },
    {
      label: t("admin.withProfilePhoto"),
      value: analytics.summary.withProfilePhoto,
    },
  ];

  return (
    <div className="mb-4 space-y-4">
      <Card className="border-l-4 border-l-[#06C755] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-gray-900">
              {t("admin.dashboardTitle")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {t("admin.dashboardDesc")}
            </p>
          </div>
          <SectionLabel>{t("admin.summary")}</SectionLabel>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-10">
          {summaryItems.map((item) => (
            <SummaryCard
              key={item.label}
              label={item.label}
              value={item.value}
              accent={item.accent}
            />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DistributionSection
          title={t("admin.membershipBreakdown")}
          rows={analytics.membership}
          emptyLabel={t("admin.noData")}
          compact
        />
        <DistributionSection
          title={t("admin.genderBreakdown")}
          rows={analytics.gender}
          emptyLabel={t("admin.noData")}
          compact
        />
        <DistributionSection
          title={t("admin.ageBreakdown")}
          rows={analytics.ageGroups}
          emptyLabel={t("admin.noData")}
          compact
        />
        <DistributionSection
          title={t("admin.signupsByMonth")}
          rows={signupsByMonth}
          emptyLabel={t("admin.noData")}
          compact
        />
        <DistributionSection
          title={t("admin.hometownBreakdown")}
          rows={analytics.hometowns}
          emptyLabel={t("admin.noData")}
          compact
        />
        <DistributionSection
          title={t("admin.postsByCategory")}
          rows={analytics.postsByCategory}
          emptyLabel={t("admin.noPosts")}
          compact
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionLabel>{t("admin.communityStats")}</SectionLabel>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SummaryCard
              label={t("admin.totalPosts")}
              value={analytics.community.posts}
            />
            <SummaryCard
              label={t("admin.totalComments")}
              value={analytics.community.comments}
            />
            <SummaryCard
              label={t("admin.totalLikes")}
              value={analytics.community.likes}
            />
            <SummaryCard
              label={t("admin.totalMessages")}
              value={analytics.community.messages}
            />
          </div>
        </Card>

        {analytics.payments ? (
          <Card className="p-5">
            <SectionLabel>{t("admin.paymentStats")}</SectionLabel>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SummaryCard
                label={t("admin.paidSubscriptions")}
                value={analytics.payments.paidCount}
                accent="text-amber-600"
              />
              <SummaryCard
                label={t("admin.totalRevenue")}
                value={`₩${analytics.payments.revenue.toLocaleString()}`}
              />
              <SummaryCard
                label={t("admin.failedPayments")}
                value={analytics.payments.failedCount}
              />
              <SummaryCard
                label={t("admin.pendingPayments")}
                value={analytics.payments.pendingCount}
              />
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-5">
            <p className="text-sm text-gray-500">{t("admin.noData")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
