"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import OperatorMemberGroupHeader from "@/components/operator/OperatorMemberGroupHeader";
import { Card, SectionLabel, pillButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { supportCategoryLabelKey } from "@/lib/support/categoryDisplay";
import { groupSupportRequestsByMember } from "@/lib/support/groupByMember";
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
  const [requests, setRequests] = useState<SupportRequest[]>([]);

  const refresh = useCallback(() => {
    setOpenCount(getOpenSupportCount());
    setUnreadCount(getUnreadSupportCountForOperator());
    setRequests(getAllSupportRequests().filter((item) => item.status !== "closed"));
  }, []);

  const memberGroups = useMemo(
    () => groupSupportRequestsByMember(requests).slice(0, 4),
    [requests]
  );

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

      {memberGroups.length > 0 && (
        <div className="mt-5 space-y-3">
          <SectionLabel>{t("admin.inboxGroupedByMember")}</SectionLabel>
          {memberGroups.map((group) => {
            const latest = group.requests[0];
            const memberUser = {
              id: group.userId,
              name: group.userNickname,
              nickname: group.userNickname,
              profileImage: group.userProfileImage,
              birthDate: "2000-01-01",
              hometown: "",
              gmail: group.userGmail,
              koreanPhone: "",
              personalCode: group.userPersonalCode,
              password: "",
              createdAt: group.latestUpdatedAt,
            };

            return (
              <Link
                key={group.userId}
                href={`/support/${latest.id}`}
                className="block overflow-hidden rounded-2xl bg-[#F0F2F5] ring-1 ring-black/[0.06] transition hover:ring-[#06C755]/30"
              >
                <OperatorMemberGroupHeader
                  member={memberUser}
                  countLabel={t("support.requestCount").replace(
                    "{count}",
                    String(group.requests.length)
                  )}
                  unreadCount={group.unreadCount}
                  compact
                />
                <p className="line-clamp-2 px-3 pb-3 text-xs leading-relaxed text-gray-600">
                  <span className="font-semibold text-sky-700">
                    {t(supportCategoryLabelKey(latest.category))}
                  </span>
                  {" · "}
                  {latest.title}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
