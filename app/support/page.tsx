"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  Card,
  FilterChip,
  dangerButtonClassName,
  pillButtonClassName,
  topicGridClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { formatPostDate } from "@/lib/posts/format";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  supportCategoryIcon,
  supportCategoryLabelKey,
} from "@/lib/support/categoryDisplay";
import { deleteSupportRequest } from "@/lib/support/actions";
import {
  getAllSupportRequests,
  getSupportRequestsForUser,
} from "@/lib/support/storage";
import type { SupportRequest, SupportStatus } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";
import { SUPPORT_SYNC_EVENT } from "@/lib/support/supportSync";

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
  onDelete,
}: {
  request: SupportRequest;
  locale: string;
  showUser?: boolean;
  operatorView?: boolean;
  onDelete?: () => void;
}) {
  const { t } = useLocale();
  const [dragX, setDragX] = useState(0);
  const [swipedOpen, setSwipedOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const lastMessage = request.messages[request.messages.length - 1];
  const hasUnread = operatorView
    ? request.unreadByOperator
    : request.unreadByUser;
  const swipeEnabled = operatorView && Boolean(onDelete);

  const resetSwipe = () => {
    setDragX(0);
    setSwipedOpen(false);
    setTouchStartX(null);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeEnabled) {
      return;
    }
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeEnabled || touchStartX == null) {
      return;
    }
    const currentX = event.touches[0]?.clientX;
    if (typeof currentX !== "number") {
      return;
    }
    const deltaX = currentX - touchStartX;
    // Left swipe reveals delete action.
    if (deltaX < 0) {
      setDragX(Math.max(deltaX, -120));
    } else {
      setDragX(Math.min(deltaX, 0));
    }
  };

  const handleTouchEnd = () => {
    if (!swipeEnabled) {
      return;
    }
    const shouldOpen = dragX <= -72;
    setSwipedOpen(shouldOpen);
    setDragX(0);
    setTouchStartX(null);
  };

  const rowOffset = swipedOpen ? -96 : dragX;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {swipeEnabled ? (
        <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center rounded-r-2xl bg-rose-500 px-2">
          <button
            type="button"
            onClick={() => {
              onDelete?.();
              resetSwipe();
            }}
            className={`${dangerButtonClassName} !rounded-xl !px-3 !py-2 text-xs`}
          >
            {t("common.delete")}
          </button>
        </div>
      ) : null}

      <div
        className="transition-transform duration-200"
        style={{ transform: `translateX(${rowOffset}px)` }}
      >
        <Link
          href={`/support/${request.id}`}
          onClick={() => {
            if (swipedOpen) {
              resetSwipe();
            }
          }}
          className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.99] hover:ring-[#06C755]/30"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-xl ring-1 ring-black/[0.04]">
              {operatorView ? supportCategoryIcon(request.category) : "📮"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(request.status)}`}
                >
                  {t(statusLabelKey(request.status))}
                </span>
                {operatorView ? (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                    {t(supportCategoryLabelKey(request.category))}
                  </span>
                ) : null}
                {operatorView ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      hasUnread
                        ? "bg-red-50 text-red-700 ring-red-100"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                    }`}
                  >
                    {hasUnread ? t("common.unread") : t("common.read")}
                  </span>
                ) : null}
                {hasUnread ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    1
                  </span>
                ) : null}
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
      </div>
    </div>
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
    window.addEventListener(SUPPORT_SYNC_EVENT, refresh);
    return () => {
      window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
      window.removeEventListener(SUPPORT_SYNC_EVENT, refresh);
    };
  }, [user?.id, showOperatorUI]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return requests;
    }
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  const handleDeleteRequest = (request: SupportRequest) => {
    if (!user) {
      return;
    }
    if (!window.confirm(t("support.deleteRequestConfirm"))) {
      return;
    }
    if (deleteSupportRequest(request.id, user)) {
      refresh();
    }
  };

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
          {filtered.map((request) => (
            <SupportRequestCard
              key={request.id}
              request={request}
              locale={locale}
              operatorView={showOperatorUI}
              showUser={showOperatorUI}
              onDelete={
                showOperatorUI ? () => handleDeleteRequest(request) : undefined
              }
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
