"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { formatAgeLabel, getUserBirthDate } from "@/lib/auth/age";
import { countLocalMembersNotOnServer } from "@/lib/admin/localMemberDirectory";
import { listRecentMembersForOperator } from "@/lib/admin/recentMembers";
import { backfillAllLocalMembersInBrowser } from "@/lib/auth/memberBackfill";
import {
  MEMBERS_SYNC_EVENT,
  fetchMembersDirectory,
} from "@/lib/auth/memberSync";
import { mergeRemoteMembers, updateUser } from "@/lib/auth/storage";
import { formatPhone } from "@/lib/auth/phone";
import { getUserNickname } from "@/lib/auth/profileImage";
import type { User } from "@/lib/auth/types";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";

function formatJoinedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(locale === "ko" ? "ko-KR" : "th-TH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MemberDetail({
  member,
  locale,
  t,
}: {
  member: User;
  locale: Locale;
  t: (key: MessageKey) => string;
}) {
  return (
    <div className="mt-3 border-t border-black/[0.06] pt-3">
    <dl className="grid gap-1.5 sm:grid-cols-2">
      <DetailRow label="Gmail" value={member.gmail} />
      <DetailRow label={t("mypage.phone")} value={formatPhone(member.koreanPhone) || "—"} />
      <DetailRow label={t("mypage.personalCode")} value={member.personalCode} />
      <DetailRow label={t("mypage.hometown")} value={member.hometown || "—"} />
      <DetailRow label={t("mypage.birthDate")} value={getUserBirthDate(member) || "—"} />
      <DetailRow label={t("mypage.age")} value={formatAgeLabel(member, locale) || "—"} />
      {member.referredBy ? (
        <DetailRow label={t("mypage.referrer")} value={member.referredBy} />
      ) : null}
      <DetailRow
        label="Role"
        value={member.role === "operator" ? t("admin.recentMembersRoleOperator") : t("admin.recentMembersRoleUser")}
      />
    </dl>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-[#F0F2F5] px-2.5 py-1.5 ring-1 ring-black/[0.04]">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="truncate text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default function OperatorRecentMembersPanel() {
  const { t, locale } = useLocale();
  const { user: operator } = useAuth();
  const [serverMembers, setServerMembers] = useState<User[]>([]);
  const [directoryConfigured, setDirectoryConfigured] = useState<boolean | null>(null);
  const [syncConfigured, setSyncConfigured] = useState<boolean | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);

  const refreshDirectory = useCallback(async () => {
    const { members, meta } = await fetchMembersDirectory();
    setDirectoryConfigured(meta.configured);
    setSyncConfigured(meta.syncConfigured);
    setServerMembers(members);
    if (meta.configured && members.length > 0) {
      mergeRemoteMembers(members);
    }
  }, []);

  useEffect(() => {
    void refreshDirectory();
    const onSync = () => {
      void refreshDirectory();
    };
    window.addEventListener(MEMBERS_SYNC_EVENT, onSync);
    return () => window.removeEventListener(MEMBERS_SYNC_EVENT, onSync);
  }, [refreshDirectory]);

  const members = useMemo(
    () => listRecentMembersForOperator(100, serverMembers),
    [serverMembers]
  );

  const localOnlyCount = useMemo(
    () => countLocalMembersNotOnServer(serverMembers),
    [serverMembers]
  );

  const handleBackfill = useCallback(async () => {
    setBackfilling(true);
    setBackfillMessage(null);
    try {
      const result = await backfillAllLocalMembersInBrowser();
      await refreshDirectory();
      setBackfillMessage(
        t("admin.recentMembersBackfillDone")
          .replace("{synced}", String(result.synced))
          .replace("{total}", String(result.total))
      );
    } finally {
      setBackfilling(false);
    }
  }, [refreshDirectory, t]);

  const handleToggleOperator = useCallback(
    (member: User) => {
      const nextRole = member.role === "operator" ? "user" : "operator";
      const updated: User = {
        ...member,
        role: nextRole,
        preferredLocale: nextRole === "operator" ? "ko" : member.preferredLocale ?? "th",
      };
      updateUser(updated);
      setRoleMessage(t("admin.recentMembersRoleUpdated"));
      void refreshDirectory();
      window.setTimeout(() => setRoleMessage(null), 2000);
    },
    [refreshDirectory, t]
  );

  return (
    <Card className="mb-4 border-l-4 border-l-sky-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-gray-900">{t("admin.recentMembersTitle")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("admin.recentMembersDesc")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755]/10 px-2.5 py-1 text-xs font-semibold text-[#06C755]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06C755]" aria-hidden />
          {t("admin.recentMembersLive")}
        </span>
      </div>

      {directoryConfigured === false ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {t("admin.recentMembersServerOff")}
        </p>
      ) : syncConfigured === false ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {t("admin.recentMembersSyncOff")}
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-950 ring-1 ring-sky-200">
          {t("admin.recentMembersLegacyHint")}
        </p>
      )}

      {localOnlyCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-gray-600">
            {t("admin.recentMembersLocalOnly").replace("{count}", String(localOnlyCount))}
          </p>
          <button
            type="button"
            disabled={backfilling}
            onClick={() => void handleBackfill()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {backfilling ? "…" : t("admin.recentMembersBackfill")}
          </button>
        </div>
      ) : null}

      {backfillMessage ? (
        <p className="mt-2 text-sm font-medium text-[#06C755]">{backfillMessage}</p>
      ) : null}
      {roleMessage ? (
        <p className="mt-2 text-sm font-medium text-[#06C755]">{roleMessage}</p>
      ) : null}

      {members.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("admin.recentMembersEmpty")}</p>
      ) : (
        <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
          {members.map((member) => {
            const expanded = expandedId === member.id;
            return (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((current) => (current === member.id ? null : member.id))
                  }
                  className={`flex w-full flex-col rounded-xl px-3 py-3 text-left ring-1 transition ${
                    expanded
                      ? "bg-white ring-2 ring-sky-400"
                      : "bg-[#F0F2F5] ring-black/[0.06] hover:bg-white"
                  }`}
                >
                  <span className="flex w-full items-center gap-3">
                    <UserAvatar user={member} size="sm" shape="square" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {getUserNickname(member)}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {member.gmail} · {member.personalCode}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                      {formatJoinedAt(member.createdAt, locale)}
                    </span>
                  </span>
                  {expanded && operator ? (
                    <>
                      <MemberDetail
                        member={member}
                        locale={locale}
                        t={t}
                      />
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleOperator(member);
                          }}
                          className="w-full rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200"
                        >
                          {member.role === "operator"
                            ? t("admin.recentMembersUnsetOperator")
                            : t("admin.recentMembersSetOperator")}
                        </button>
                      </div>
                    </>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
