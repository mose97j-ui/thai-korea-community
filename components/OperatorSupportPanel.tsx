"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, SectionLabel, pillButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { supportCategoryLabelKey } from "@/lib/support/categoryDisplay";
import {
  getAllSupportRequests,
  getOpenSupportCount,
  getUnreadSupportCountForOperator,
} from "@/lib/support/storage";
import type { SupportRequest } from "@/lib/support/types";
import { SUPPORT_SYNC_EVENT } from "@/lib/support/supportSync";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

export default function OperatorSupportPanel() {
  const { t } = useLocale();
  const [openCount, setOpenCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<SupportRequest[]>([]);

  const refresh = useCallback(() => {
    setOpenCount(getOpenSupportCount());
    setUnreadCount(getUnreadSupportCountForOperator());
    setRecent(
      getAllSupportRequests()
        .filter((item) => item.status !== "closed")
        .slice(0, 4)
    );
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(SUPPORT_CHANGE_EVENT, refresh);
    window.addEventListener(SUPPORT_SYNC_EVENT, refresh);
    return () => {
      window.removeEventListener(SUPPORT_CHANGE_EVENT, refresh);
      window.removeEventListener(SUPPORT_SYNC_EVENT, refresh);
    };
  }, [refresh]);

  return (
    <Card className="mb-4 border-l-4 border-l-sky-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-gray-900">{t("support.operatorPanelTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("support.operatorPanelDesc")}
          </p>
        </div>
        <Link href="/support" className={pillButtonClassName}>
          {t("support.viewAll")}
          {unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-[#F0F2F5] px-3 py-3 ring-1 ring-black/[0.06]">
          <p className="text-xs text-gray-500">{t("support.openCount")}</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{openCount}</p>
        </div>
        <div className="rounded-xl bg-[#F0F2F5] px-3 py-3 ring-1 ring-black/[0.06]">
          <p className="text-xs text-gray-500">{t("support.unreadCount")}</p>
          <p className="mt-1 text-2xl font-bold text-red-500">{unreadCount}</p>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-5">
          <SectionLabel>{t("support.recentRequests")}</SectionLabel>
          <div className="space-y-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/support/${item.id}`}
                className="block rounded-xl bg-[#F0F2F5] px-3 py-3 ring-1 ring-black/[0.06] transition hover:bg-white"
              >
                <p className="truncate text-sm font-bold text-gray-900">{item.title}</p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  <span className="font-semibold text-sky-700">
                    {t(supportCategoryLabelKey(item.category))}
                  </span>
                  {" · "}
                  {item.userNickname} · {item.userGmail}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
