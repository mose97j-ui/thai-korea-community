"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SocialPageShell from "@/components/SocialPageShell";
import { compactSecondaryButtonClassName } from "@/components/ui";
import { pageStickyHeaderClassName } from "@/components/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPostDate } from "@/lib/posts/format";
import {
  getNotificationHref,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/social/notifications";
import type { Notification } from "@/lib/social/types";
import { SOCIAL_CHANGE_EVENT } from "@/lib/social/types";

function notificationIcon(type: Notification["type"]) {
  if (type === "like") return "❤️";
  if (type === "comment") return "💬";
  return "✉️";
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isReady } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fnotifications");
    }
  }, [isReady, user, router]);

  const refresh = () => {
    if (user) {
      setItems(getNotifications(user.id));
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SOCIAL_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(SOCIAL_CHANGE_EVENT, refresh);
  }, [user?.id]);

  if (!isReady || !user) {
    return null;
  }

  return (
    <SocialPageShell>
      <div className={`${pageStickyHeaderClassName} flex items-center gap-3 px-3 py-3`}>
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2F5] text-lg ring-1 ring-black/[0.06]"
          aria-label={t("common.backHome")}
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-gray-900">
            {t("social.notifications")}
          </h1>
          <p className="text-xs text-gray-500">{t("social.notificationsDesc")}</p>
        </div>
        {items.some((item) => !item.read) ? (
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead(user.id);
              refresh();
            }}
            className={`shrink-0 ${compactSecondaryButtonClassName}`}
          >
            {t("social.markAllRead")}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="px-3 py-16 text-center text-base text-gray-500">
          {t("social.noNotifications")}
        </div>
      ) : (
        <div className="divide-y divide-gray-200/80 bg-white">
          {items.map((item) => (
            <Link
              key={item.id}
              href={getNotificationHref(item)}
              onClick={() => markNotificationRead(item.id, user.id)}
              className={`flex items-start gap-3 px-3 py-3.5 transition active:bg-gray-50 ${
                item.read ? "" : "bg-[#06C755]/5"
              }`}
            >
              <span className="mt-0.5 text-2xl">{notificationIcon(item.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-snug text-gray-900">
                  {t(
                    item.type === "like"
                      ? "social.notifLike"
                      : item.type === "comment"
                        ? "social.notifComment"
                        : "social.notifMessage"
                  ).replace("{name}", item.actorNickname)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">
                  {item.preview}
                </p>
                <p className="mt-1.5 text-xs text-gray-400">
                  {formatPostDate(item.createdAt, locale)}
                </p>
              </div>
              {!item.read ? (
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#06C755]" />
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </SocialPageShell>
  );
}
