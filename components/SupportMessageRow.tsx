"use client";

import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import type { SupportMessage } from "@/lib/support/types";

type SupportMessageRowProps = {
  message: SupportMessage;
  locale: "ko" | "th";
  operatorLabel: string;
  canDelete: boolean;
  onDelete?: () => void;
};

export default function SupportMessageRow({
  message,
  locale,
  operatorLabel,
  canDelete,
  onDelete,
}: SupportMessageRowProps) {
  const { t } = useLocale();
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
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold opacity-80">
            {message.isOperator ? operatorLabel : message.authorNickname}
          </p>
          {canDelete && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                message.isOperator
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-white text-gray-600 ring-1 ring-black/[0.08] hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              {t("common.delete")}
            </button>
          ) : null}
        </div>
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
}
