"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useSocialBadges } from "@/hooks/useSocialBadges";
import { useSupportBadges } from "@/hooks/useSupportBadges";
import { useReportBadges } from "@/hooks/useReportBadges";
import { useOperatorView } from "@/hooks/useOperatorView";
import { getUserNickname } from "@/lib/auth/profileImage";
import { navIconButtonClassName } from "@/components/ui";
import GenderBadge from "@/components/GenderBadge";
import NavProfilePhotoButton from "@/components/NavProfilePhotoButton";

function NavIconLink({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative shrink-0 ${navIconButtonClassName}`}
    >
      {icon}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-1 ring-[#F0F2F5]">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function TopNav() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { unreadMessages, unreadNotifications } = useSocialBadges();
  const { unreadSupport } = useSupportBadges();
  const { pendingReports } = useReportBadges();
  const {
    isOperator,
    viewAsUser,
    showOperatorUI,
    enterOperatorMode,
    enterMemberPreviewMode,
  } = useOperatorView();
  const operatorBadge = user && showOperatorUI ? pendingReports : 0;

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-1.5 overflow-hidden">
      <div className="flex w-full max-w-full items-center justify-center gap-1 sm:gap-1.5">
        <NavIconLink
          href={user ? "/messages" : "/login?next=%2Fmessages"}
          label={t("nav.chat")}
          icon="💬"
          badge={user ? unreadMessages : 0}
        />
        <NavIconLink
          href={user ? "/notifications" : "/login?next=%2Fnotifications"}
          label={t("nav.alert")}
          icon="🔔"
          badge={user ? unreadNotifications : 0}
        />
        <NavIconLink href="/" label={t("nav.home")} icon="🏠" />
        <NavIconLink
          href="/mypage"
          label={t("nav.mypage")}
          icon="👤"
          badge={operatorBadge}
        />
      </div>

      {user && (
        <div className="flex w-full max-w-full flex-col items-center gap-1 pt-0.5">
          <NavProfilePhotoButton user={user} />
          <div className="flex w-full max-w-full items-center justify-center gap-1">
            <p className="text-ui-chip line-clamp-1 min-w-0 flex-1 text-center text-xs font-bold leading-tight text-gray-900">
              {getUserNickname(user)}
            </p>
            {user.gender ? (
              <GenderBadge
                gender={user.gender}
                label={
                  user.gender === "male"
                    ? t("profile.genderMale")
                    : t("profile.genderFemale")
                }
                compact
                className="!px-1 !py-0 !text-[10px]"
              />
            ) : null}
          </div>
          {isOperator ? (
            <div
              className="flex w-full max-w-full rounded-full bg-white p-0.5 shadow-sm ring-1 ring-black/[0.06]"
              role="tablist"
              aria-label={t("operator.modeSwitchLabel")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={showOperatorUI}
                onClick={enterOperatorMode}
                className={`text-ui-btn flex-1 rounded-full px-1 py-1 text-[10px] font-semibold leading-tight transition sm:text-[11px] ${
                  showOperatorUI
                    ? "bg-[#06C755] text-white"
                    : "text-[#65676B]"
                }`}
              >
                {t("operator.modeOperatorShort")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewAsUser}
                onClick={enterMemberPreviewMode}
                className={`text-ui-btn flex-1 rounded-full px-1 py-1 text-[10px] font-semibold leading-tight transition sm:text-[11px] ${
                  viewAsUser
                    ? "bg-amber-500 text-white"
                    : "text-[#65676B]"
                }`}
              >
                {t("operator.modeMemberShort")}
              </button>
            </div>
          ) : null}
          <Link
            href="/support"
            className="relative flex w-full max-w-full items-center justify-center gap-1 rounded-full bg-white px-2 py-1.5 text-[11px] font-semibold leading-tight text-[#050505] shadow-sm ring-1 ring-black/[0.06] transition hover:bg-[#06C755]/5 hover:text-[#06C755] hover:ring-[#06C755]/25 sm:text-xs"
          >
            <span aria-hidden className="text-sm">
              📮
            </span>
            <span className="text-ui-chip line-clamp-2 min-w-0 text-center">
              {t("support.navLink")}
            </span>
            {unreadSupport > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-1 ring-[#F0F2F5]">
                {unreadSupport > 99 ? "99+" : unreadSupport}
              </span>
            ) : null}
          </Link>
        </div>
      )}
    </div>
  );
}
