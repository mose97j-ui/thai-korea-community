"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import ContentModerationActions from "@/components/ContentModerationActions";
import { compactSecondaryButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatAgeLabel, getUserBirthDate } from "@/lib/auth/age";
import { useOperatorView } from "@/hooks/useOperatorView";
import { formatPhone } from "@/lib/auth/phone";
import { getUserNickname } from "@/lib/auth/profileImage";
import { findUserById } from "@/lib/auth/storage";
import {
  getHomeCategoryById,
  getSubCategoryItem,
} from "@/lib/categories/registry";
import { formatPostDate } from "@/lib/posts/format";
import type { Post } from "@/lib/posts/types";

type OperatorPostAuthorInfoProps = {
  post: Post;
  compact?: boolean;
  showModeration?: boolean;
  defaultExpanded?: boolean;
};

export default function OperatorPostAuthorInfo({
  post,
  compact = false,
  showModeration = true,
  defaultExpanded = false,
}: OperatorPostAuthorInfoProps) {
  const { user } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const { t, pick, locale } = useLocale();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const author = useMemo(
    () => findUserById(post.authorId),
    [post.authorId]
  );

  if (!user || !showOperatorUI) {
    return null;
  }

  const category = getHomeCategoryById(post.categoryId);
  const subItem = getSubCategoryItem(post.categoryId, post.subId);

  return (
    <div
      className={`mb-4 rounded-2xl border border-l-4 border-l-[#06C755] bg-[#06C755]/5 p-4 ring-1 ring-[#06C755]/15 ${
        compact ? "text-sm" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-[#06C755]">
          {t("operator.authorPanelTitle")}
        </span>
        <span className="shrink-0 text-xs font-semibold text-gray-500">
          {expanded ? t("operator.authorPanelCollapse") : t("operator.authorPanelExpand")}
        </span>
      </button>

      {!expanded ? (
        <p className="mt-2 text-sm text-gray-600">
          {author ? (
            <>
              <span className="font-semibold text-gray-900">
                {getUserNickname(author)}
              </span>
              <span className="text-gray-400"> · </span>
              <span className="truncate">{author.gmail}</span>
            </>
          ) : (
            <>
              {t("operator.authorNotFound")} · {post.authorNickname}
            </>
          )}
        </p>
      ) : author ? (
        <div className="mt-3 flex gap-3">
          <UserAvatar user={author} size="sm" shape="square" />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="font-bold text-gray-900">
                {getUserNickname(author)}{" "}
                <span className="font-normal text-gray-500">({author.name})</span>
              </p>
              <p className="text-xs text-gray-500">
                {formatPostDate(post.createdAt, locale)} · {post.id.slice(0, 8)}
              </p>
            </div>

            <dl className="grid gap-1.5 sm:grid-cols-2">
              <InfoRow label="Gmail" value={author.gmail} />
              <InfoRow label={t("mypage.phone")} value={formatPhone(author.koreanPhone)} />
              <InfoRow label={t("mypage.personalCode")} value={author.personalCode} />
              <InfoRow label={t("mypage.hometown")} value={author.hometown || "—"} />
              <InfoRow label={t("mypage.age")} value={formatAgeLabel(author, locale)} />
              <InfoRow label={t("mypage.birthDate")} value={getUserBirthDate(author)} />
              {author.gender && (
                <InfoRow
                  label={t("operator.gender")}
                  value={
                    author.gender === "male"
                      ? t("profile.genderMale")
                      : t("profile.genderFemale")
                  }
                />
              )}
              {author.referredBy && (
                <InfoRow label={t("mypage.referrer")} value={author.referredBy} />
              )}
            </dl>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                href={`/messages/${author.id}?post=${encodeURIComponent(post.id)}`}
                className={compactSecondaryButtonClassName}
              >
                ✉️ {t("operator.messageAuthor")}
              </Link>
              {(category || subItem) && (
                <span className="inline-flex w-full items-center rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-gray-600 ring-1 ring-black/[0.06]">
                  {category ? pick(category.label) : post.categoryId}
                  {subItem ? ` · ${pick(subItem.title)}` : ""}
                </span>
              )}
            </div>

            {showModeration && (
              <div className="space-y-2 rounded-xl bg-white/70 p-2 ring-1 ring-black/[0.04]">
                <ContentModerationActions
                  targetUserId={post.authorId}
                  targetType="post"
                  targetId={post.id}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          {t("operator.authorNotFound")} · ID {post.authorId.slice(0, 8)} ·{" "}
          {post.authorNickname}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-black/[0.04]">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="truncate text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
