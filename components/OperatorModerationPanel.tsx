"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import {
  Card,
  ErrorMessage,
  FormField,
  SectionLabel,
  inputClassName,
  compactSecondaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import {
  MODERATION_CHANGE_EVENT,
  applyUserRestriction,
  clearUserRestriction,
  getActiveRestriction,
  listRestrictedUsers,
  searchUsersForModeration,
  type RestrictionScope,
} from "@/lib/auth/moderation";
import { MEMBERS_SYNC_EVENT } from "@/lib/auth/memberSync";
import { useOperatorView } from "@/hooks/useOperatorView";
import { findUserById } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import type { MessageKey } from "@/lib/i18n/messages";

type PresetAction = {
  id: string;
  labelKey: MessageKey;
  scope: RestrictionScope;
  durationDays: number | null;
  tone?: "danger";
};

const presetActions: PresetAction[] = [
  { id: "write-7", labelKey: "moderation.presetWrite7", scope: "write", durationDays: 7 },
  { id: "write-30", labelKey: "moderation.presetWrite30", scope: "write", durationDays: 30 },
  { id: "write-perm", labelKey: "moderation.presetWritePerm", scope: "write", durationDays: null },
  { id: "comment-7", labelKey: "moderation.presetComment7", scope: "comment", durationDays: 7 },
  { id: "comment-30", labelKey: "moderation.presetComment30", scope: "comment", durationDays: 30 },
  { id: "activity-7", labelKey: "moderation.presetActivity7", scope: "activity", durationDays: 7 },
  { id: "activity-30", labelKey: "moderation.presetActivity30", scope: "activity", durationDays: 30 },
  {
    id: "permanent",
    labelKey: "moderation.presetPermanent",
    scope: "permanent",
    durationDays: null,
    tone: "danger",
  },
];

function scopeLabelKey(scope: RestrictionScope): MessageKey {
  switch (scope) {
    case "write":
      return "moderation.scopeWrite";
    case "comment":
      return "moderation.scopeComment";
    case "message":
      return "moderation.scopeMessage";
    case "activity":
      return "moderation.scopeActivity";
    case "permanent":
      return "moderation.scopePermanent";
    default:
      return "moderation.scopeActivity";
  }
}

function formatUntil(iso: string | undefined, locale: string, permanentLabel: string) {
  if (!iso) {
    return permanentLabel;
  }
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

export default function OperatorModerationPanel() {
  const { t, locale } = useLocale();
  const { user: operator } = useAuth();
  const { showOperatorUI } = useOperatorView();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [reason, setReason] = useState("");
  const [restricted, setRestricted] = useState<User[]>([]);
  const [membersVersion, setMembersVersion] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshRestricted = useCallback(() => {
    setRestricted(listRestrictedUsers());
    setSelected((current) => (current ? findUserById(current.id) ?? null : null));
  }, []);

  useEffect(() => {
    refreshRestricted();
    const onMembersSync = () => setMembersVersion((value) => value + 1);
    window.addEventListener(MODERATION_CHANGE_EVENT, refreshRestricted);
    window.addEventListener(MEMBERS_SYNC_EVENT, onMembersSync);
    window.addEventListener(MEMBERS_SYNC_EVENT, refreshRestricted);
    return () => {
      window.removeEventListener(MODERATION_CHANGE_EVENT, refreshRestricted);
      window.removeEventListener(MEMBERS_SYNC_EVENT, onMembersSync);
      window.removeEventListener(MEMBERS_SYNC_EVENT, refreshRestricted);
    };
  }, [refreshRestricted]);

  useEffect(() => {
    setResults(query.trim() ? searchUsersForModeration(query) : []);
  }, [query, restricted, membersVersion]);

  const activeRestriction = useMemo(
    () => (selected ? getActiveRestriction(selected) : null),
    [selected]
  );

  if (!operator || !showOperatorUI) {
    return null;
  }

  const handleSelect = (target: User) => {
    setSelected(target);
    setError("");
    setSuccess("");
  };

  const handleApply = (preset: PresetAction) => {
    if (!selected) {
      setError(t("moderation.selectUser"));
      return;
    }

    setError("");
    setSuccess("");
    const result = applyUserRestriction(selected.id, operator, {
      scope: preset.scope,
      reason,
      durationDays: preset.durationDays,
    });

    if (!result.ok) {
      setError(
        result.error === "OPERATOR_TARGET"
          ? t("moderation.operatorTarget")
          : t("moderation.userNotFound")
      );
      return;
    }

    setSelected(result.user);
    setSuccess(t("moderation.applied"));
    refreshRestricted();
  };

  const handleClear = () => {
    if (!selected) {
      setError(t("moderation.selectUser"));
      return;
    }

    setError("");
    setSuccess("");
    const result = clearUserRestriction(selected.id, operator);
    if (!result.ok) {
      setError(t("moderation.userNotFound"));
      return;
    }

    setSelected(result.user);
    setSuccess(t("moderation.cleared"));
    refreshRestricted();
  };

  return (
    <div className="mb-4 space-y-4">
      <Card className="border-l-4 border-l-rose-500 p-5">
        <p className="text-xl font-bold text-gray-900">{t("moderation.panelTitle")}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {t("moderation.panelDesc")}
        </p>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <FormField label={t("moderation.searchLabel")}>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("moderation.searchPlaceholder")}
                className={inputClassName}
              />
            </FormField>

            {results.length > 0 && (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-[#F0F2F5] p-2 ring-1 ring-black/[0.06]">
                {results.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => handleSelect(target)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      selected?.id === target.id
                        ? "bg-white ring-2 ring-[#06C755]"
                        : "bg-white/80 hover:bg-white"
                    }`}
                  >
                    <UserAvatar user={target} size="sm" shape="square" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {target.nickname}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {target.gmail} · {target.personalCode}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selected ? (
              <Card className="bg-[#F8F9FA] p-4 ring-1 ring-black/[0.04]">
                <div className="flex items-start gap-3">
                  <UserAvatar user={selected} size="md" shape="square" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900">
                      {selected.nickname}
                    </p>
                    <p className="text-sm text-gray-500">{selected.gmail}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {selected.personalCode} · {selected.koreanPhone}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      {t("moderation.currentStatus")}:{" "}
                      {activeRestriction ? (
                        <span className="text-rose-600">
                          {t(scopeLabelKey(activeRestriction.scope))}
                          {activeRestriction.until
                            ? ` · ${formatUntil(
                                activeRestriction.until,
                                locale,
                                t("moderation.permanent")
                              )}`
                            : ` · ${t("moderation.permanent")}`}
                        </span>
                      ) : (
                        <span className="text-[#06C755]">{t("moderation.statusNormal")}</span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <p className="text-sm text-gray-500">{t("moderation.searchHint")}</p>
            )}

            <FormField label={t("moderation.reasonLabel")}>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("moderation.reasonPlaceholder")}
                rows={2}
                maxLength={200}
                className={`${inputClassName} min-h-[72px] resize-y`}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {presetActions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApply(preset)}
                  className={
                    preset.tone === "danger"
                      ? `${compactSecondaryButtonClassName} bg-rose-600 text-white hover:bg-rose-700`
                      : compactSecondaryButtonClassName
                  }
                >
                  {t(preset.labelKey)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClear}
              className={compactSecondaryButtonClassName}
            >
              {t("moderation.clearRestriction")}
            </button>

            {error && <ErrorMessage message={error} />}
            {success && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
                {success}
              </p>
            )}
          </div>

          <div>
            <SectionLabel>{t("moderation.restrictedList")}</SectionLabel>
            {restricted.length === 0 ? (
              <p className="px-1 text-sm text-gray-500">{t("moderation.noRestricted")}</p>
            ) : (
              <div className="max-h-[min(520px,60vh)] space-y-2 overflow-y-auto pr-1">
                {restricted.map((target) => {
                  const restriction = getActiveRestriction(target);
                  if (!restriction) {
                    return null;
                  }

                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => handleSelect(target)}
                      className="w-full rounded-xl bg-[#F0F2F5] px-3 py-3 text-left ring-1 ring-black/[0.06] transition hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar user={target} size="sm" shape="square" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-gray-900">
                            {target.nickname}
                          </span>
                          <span className="block truncate text-xs text-rose-600">
                            {t(scopeLabelKey(restriction.scope))}
                            {" · "}
                            {formatUntil(
                              restriction.until,
                              locale,
                              t("moderation.permanent")
                            )}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
