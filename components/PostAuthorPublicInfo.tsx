"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { compactSecondaryButtonClassName } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import type { Post } from "@/lib/posts/types";
import type { User } from "@/lib/auth/types";

type PostAuthorPublicInfoProps = {
  post: Post;
  author: User;
  hideMessageActions?: boolean;
};

export default function PostAuthorPublicInfo({
  post,
  author,
  hideMessageActions = false,
}: PostAuthorPublicInfoProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [messageSent] = useState(false);

  const showMessageButton = Boolean(user && user.id !== post.authorId);

  const handleMessageClick = () => {
    if (!user) {
      router.push("/login?next=%2Fsupport%2Fnew");
      return;
    }
    router.push("/support/new");
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 max-w-[8rem] text-right sm:max-w-[9.5rem]">
          <p className="truncate text-sm font-bold text-gray-900">
            {post.authorNickname}
          </p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-gray-400">
            {formatPostDate(post.createdAt, locale)}
          </p>
        </div>
        <UserAvatar user={author} size="sm" />
      </div>

      {showMessageButton && !hideMessageActions ? (
        <button
          type="button"
          onClick={handleMessageClick}
          className={`${compactSecondaryButtonClassName} !px-3 !py-1.5 text-xs`}
        >
          📮 {t("support.newRequest")}
        </button>
      ) : null}

      {showMessageButton && !hideMessageActions && messageSent ? (
        <p className="text-xs font-medium text-[#06C755]">{t("social.messageSent")}</p>
      ) : null}
    </div>
  );
}
