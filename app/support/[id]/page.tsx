"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import UserAvatar from "@/components/UserAvatar";
import {
  Card,
  inputClassName,
  pillSecondaryButtonClassName,
  primaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import type { MessageKey } from "@/lib/i18n/messages";
import { formatPostDate } from "@/lib/posts/format";
import {
  addSupportReply,
  getSupportRequestById,
  markSupportRequestRead,
  updateSupportStatus,
} from "@/lib/support/storage";
import type { SupportCategory, SupportRequest, SupportStatus } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

type SupportDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

export default function SupportDetailPage({ params }: SupportDetailPageProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isReady } = useAuth();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<SupportRequest | null | undefined>(undefined);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { showOperatorUI } = useOperatorView();

  useEffect(() => {
    void params.then((route) => setRequestId(route.id));
  }, [params]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fsupport");
    }
  }, [isReady, user, router]);

  const refresh = () => {
    if (!requestId) {
      return;
    }
    const next = getSupportRequestById(requestId);
    setRequest(next);
    if (next && user) {
      markSupportRequestRead(next.id, user);
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
  }, [requestId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [request?.messages.length]);

  if (!isReady || !user || request === undefined) {
    return (
    <PageShell maxWidth="full">
        <Card className="py-10 text-center text-base text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  if (!request) {
    notFound();
  }

  const canView = showOperatorUI || request.userId === user.id;
  if (!canView) {
    notFound();
  }

  const closed = request.status === "closed";

  const handleReply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reply.trim() || closed) {
      return;
    }
    addSupportReply(request.id, user, reply);
    setReply("");
    refresh();
  };

  const handleStatus = (status: SupportStatus) => {
    if (!showOperatorUI) {
      return;
    }
    updateSupportStatus(request.id, status, user);
    refresh();
  };

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title={request.title}
        backHref="/support"
        backLabel={t("support.title")}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
            {t(categoryLabelKey(request.category))}
          </span>
          <span className="rounded-full bg-[#F0F2F5] px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-black/[0.06]">
            {t(statusLabelKey(request.status))}
          </span>
        </div>
        {showOperatorUI && (
          <p className="mt-3 text-sm text-gray-500">
            {request.userNickname} · {request.userGmail}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {t("support.createdAt")}: {formatPostDate(request.createdAt, locale)}
        </p>
      </Card>

      {showOperatorUI && (
        <Card className="mb-4 flex flex-wrap gap-2 p-4">
          <button
            type="button"
            onClick={() => handleStatus("answered")}
            className={pillSecondaryButtonClassName}
          >
            {t("support.markAnswered")}
          </button>
          <button
            type="button"
            onClick={() => handleStatus("closed")}
            className={pillSecondaryButtonClassName}
          >
            {t("support.markClosed")}
          </button>
          {request.status === "closed" && (
            <button
              type="button"
              onClick={() => handleStatus("open")}
              className={pillSecondaryButtonClassName}
            >
              {t("support.reopen")}
            </button>
          )}
        </Card>
      )}

      <Card className="mb-4">
        <div className="space-y-3">
          {request.messages.map((message) => {
            const authorUser = {
              id: message.authorId,
              name: message.authorNickname,
              nickname: message.authorNickname,
              profileImage: message.authorProfileImage,
              birthDate: "2000-01-01",
              hometown: "",
              gmail: "",
              koreanPhone: "",
              personalCode: "",
              password: "",
              createdAt: message.createdAt,
            };

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isOperator ? "flex-row-reverse" : ""}`}
              >
                <UserAvatar user={authorUser} size="sm" shape="square" />
                <div
                  className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.isOperator
                      ? "bg-[#06C755] text-white"
                      : "bg-[#F0F2F5] text-gray-900 ring-1 ring-black/[0.06]"
                  }`}
                >
                  <p className="text-xs font-semibold opacity-80">
                    {message.isOperator
                      ? t("support.operatorReply")
                      : message.authorNickname}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      message.isOperator ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {formatPostDate(message.createdAt, locale)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </Card>

      {closed ? (
        <Card className="py-6 text-center text-sm text-gray-500">
          {t("support.closedNotice")}
        </Card>
      ) : (
        <form onSubmit={handleReply} className="flex gap-2">
          <input
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={
              showOperatorUI
                ? t("support.operatorReplyPlaceholder")
                : t("support.replyPlaceholder")
            }
            className={inputClassName}
            maxLength={2000}
          />
          <button type="submit" className={`shrink-0 ${primaryButtonClassName} px-5`}>
            {t("support.sendReply")}
          </button>
        </form>
      )}
    </PageShell>
  );
}
