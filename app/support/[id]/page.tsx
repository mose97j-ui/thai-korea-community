"use client";

import { notFound, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import SupportMessageRow from "@/components/SupportMessageRow";
import {
  Card,
  textareaClassName,
  pillSecondaryButtonClassName,
  primaryButtonClassName,
  dangerButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { formatPostDate } from "@/lib/posts/format";
import { supportCategoryLabelKey } from "@/lib/support/categoryDisplay";
import {
  canDeleteSupportMessage,
  deleteSupportMessage,
  deleteSupportRequest,
} from "@/lib/support/actions";
import { blockUser, isUserBlocked, unblockUser } from "@/lib/social/blocks";
import {
  addSupportReply,
  getSupportRequestById,
  markSupportRequestRead,
  updateSupportStatus,
} from "@/lib/support/storage";
import type { SupportRequest, SupportStatus } from "@/lib/support/types";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";
import type { MessageKey } from "@/lib/i18n/messages";

type SupportDetailPageProps = {
  params: Promise<{ id: string }>;
};

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
  const blockedByMe = Boolean(
    showOperatorUI && isUserBlocked(user.id, request.userId)
  );

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

  const handleDeleteRequest = () => {
    if (!window.confirm(t("support.deleteRequestConfirm"))) {
      return;
    }
    if (deleteSupportRequest(request.id, user)) {
      router.push("/support");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!window.confirm(t("support.deleteMessageConfirm"))) {
      return;
    }
    if (deleteSupportMessage(request.id, messageId, user)) {
      const remaining = getSupportRequestById(request.id);
      if (!remaining) {
        router.push("/support");
        return;
      }
      refresh();
    }
  };

  const toggleBlockMember = () => {
    if (!showOperatorUI) {
      return;
    }
    if (blockedByMe) {
      unblockUser(user.id, request.userId);
    } else {
      blockUser(user.id, request.userId);
    }
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
          {showOperatorUI ? (
            <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
              {t("support.operatorCategory")}: {t(supportCategoryLabelKey(request.category))}
            </span>
          ) : null}
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

      <Card className="mb-4 flex flex-wrap gap-2 p-4">
        {showOperatorUI ? (
          <>
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
            {request.status === "closed" ? (
              <button
                type="button"
                onClick={() => handleStatus("open")}
                className={pillSecondaryButtonClassName}
              >
                {t("support.reopen")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={toggleBlockMember}
              className={pillSecondaryButtonClassName}
            >
              {blockedByMe ? t("social.unblockUser") : t("support.blockMember")}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleDeleteRequest}
          className={`${dangerButtonClassName} !px-4 !py-2 text-sm`}
        >
          {t("support.deleteRequest")}
        </button>
      </Card>

      <Card className="mb-4">
        <div className="space-y-3">
          {request.messages.map((message) => (
            <SupportMessageRow
              key={message.id}
              message={message}
              locale={locale}
              operatorLabel={t("support.operatorReply")}
              canDelete={canDeleteSupportMessage(request, message, user)}
              onDelete={() => handleDeleteMessage(message.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      {closed ? (
        <Card className="py-6 text-center text-sm text-gray-500">
          {t("support.closedNotice")}
        </Card>
      ) : (
        <form onSubmit={handleReply} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={
              showOperatorUI
                ? t("support.operatorReplyPlaceholder")
                : t("support.replyPlaceholder")
            }
            rows={3}
            className={`${textareaClassName} min-h-[5rem] flex-1`}
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
