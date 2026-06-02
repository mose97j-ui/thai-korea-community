"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  Card,
  FilterChip,
  SectionLabel,
  pillButtonClassName,
  topicGridClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { formatPostDate } from "@/lib/posts/format";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  getAllSupportRequests,
  getSupportRequestsForUser,
} from "@/lib/support/storage";
import type { SupportCategory, SupportRequest, SupportStatus } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

function categoryLabelKey(category: SupportCategory): MessageKey {
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

function categoryIcon(category: SupportCategory): string {
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

function statusLabelKey(status: SupportStatus): MessageKey {
  switch (status) {
    case "open":
      return "support.statusOpen";
    case "answered":
      return "support.statusAnswered";
    default:
      return "support.statusClosed";
  }
}

function statusClassName(status: SupportStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "answered":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}

function SupportRequestCard({
  request,
  locale,
  showUser,
  operatorView,
}: {
  request: SupportRequest;
  locale: string;
  showUser?: boolean;
  operatorView?: boolean;
}) {
  const { t } = useLocale();
  const lastMessage = request.messages[request.messages.length - 1];
  const hasUnread = operatorView
    ? request.unreadByOperator
    : request.unreadByUser;

  return (
    <Link
      href={`/support/${request.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.99] hover:ring-[#06C755]/30"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-xl ring-1 ring-black/[0.04]">
          {categoryIcon(request.category)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(request.status)}`}
            >
              {t(statusLabelKey(request.status))}
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              {t(categoryLabelKey(request.category))}
            </span>
            {hasUnread && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                NEW
              </span>
            )}
          </div>
          <p className="mt-2 text-lg font-bold leading-snug text-gray-900">
            {request.title}
          </p>
          {showUser && (
            <p className="mt-1 text-sm text-gray-500">
              {request.userNickname} · {request.userGmail}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {lastMessage?.content}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {formatPostDate(request.updatedAt, locale as "ko" | "th")}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isReady } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "all">("all");

  const { showOperatorUI } = useOperatorView();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fsupport");
    }
  }, [isReady, user, router]);

  const refresh = () => {
    if (!user) {
      return;
    }
    setRequests(
      showOperatorUI ? getAllSupportRequests() : getSupportRequestsForUser(user.id)
    );
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
  }, [user?.id, showOperatorUI]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return requests;
    }
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  if (!isReady || !user) {
    return null;
  }

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title={showOperatorUI ? t("support.operatorTitle") : t("support.title")}
        backHref={showOperatorUI ? "/mypage" : "/"}
        backLabel={showOperatorUI ? t("common.backMypage") : t("common.backHome")}
      />

      <Card className="mb-4">
        <p className="text-sm leading-relaxed text-gray-600">
          {showOperatorUI ? t("support.operatorDesc") : t("support.desc")}
        </p>
        {!showOperatorUI && (
          <Link href="/support/new" className={`mt-4 inline-flex ${pillButtonClassName}`}>
            {t("support.newRequest")}
          </Link>
        )}
      </Card>

      {showOperatorUI && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "open", "answered", "closed"] as const).map((item) => (
            <FilterChip
              key={item}
              active={statusFilter === item}
              onClick={() => setStatusFilter(item)}
            >
              {item === "all"
                ? t("support.filterAll")
                : t(statusLabelKey(item))}
            </FilterChip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-4xl">📮</p>
          <p className="mt-3 text-base text-gray-500">{t("support.empty")}</p>
          {!showOperatorUI && (
            <Link href="/support/new" className={`mt-4 inline-flex ${pillButtonClassName}`}>
              {t("support.writeFirst")}
            </Link>
          )}
        </Card>
      ) : (
        <div className={topicGridClassName}>
          {showOperatorUI && (
            <div className="col-span-full">
              <SectionLabel>{t("support.requestList")}</SectionLabel>
            </div>
          )}
          {filtered.map((request) => (
            <SupportRequestCard
              key={request.id}
              request={request}
              locale={locale}
              showUser={showOperatorUI}
              operatorView={showOperatorUI}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
