"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useSocialBadges } from "@/hooks/useSocialBadges";
import { useSupportBadges } from "@/hooks/useSupportBadges";
import { useReportBadges } from "@/hooks/useReportBadges";
import { useOperatorView } from "@/hooks/useOperatorView";
import { useMobileNavDock } from "@/hooks/useMobileNavDock";
import { getUserNickname } from "@/lib/auth/profileImage";
import { navIconButtonClassName } from "@/components/ui";
import GenderBadge from "@/components/GenderBadge";
import NavProfilePhotoButton from "@/components/NavProfilePhotoButton";
import UserAvatar from "@/components/UserAvatar";
import {
  SYMBOL_DOCK_EXPAND,
  SYMBOL_NAV_ALERT,
  SYMBOL_NAV_HOME,
  SYMBOL_NAV_PROFILE,
  SYMBOL_NAV_SUPPORT,
} from "@/lib/ui/symbols";

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

type MobileNavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  match: (path: string) => boolean;
};

export default function TopNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user } = useAuth();
  const { unreadNotifications } = useSocialBadges();
  const { unreadSupport } = useSupportBadges();
  const { pendingReports } = useReportBadges();
  const { expanded: dockExpanded, toggle: toggleDock, collapse: collapseDock } =
    useMobileNavDock();
  const {
    isOperator,
    viewAsUser,
    showOperatorUI,
    enterOperatorMode,
    enterMemberPreviewMode,
  } = useOperatorView();
  const operatorBadge =
    user && showOperatorUI ? pendingReports + unreadSupport : 0;
  const supportBadge = user ? unreadSupport : 0;

  const mobileItems: MobileNavItem[] = [
    {
      href: "/",
      label: t("nav.home"),
      icon: SYMBOL_NAV_HOME,
      match: (path) => path === "/",
    },
    {
      href: user ? "/support" : "/login?next=%2Fsupport",
      label: t("nav.support"),
      icon: SYMBOL_NAV_SUPPORT,
      badge: supportBadge,
      match: (path) => path.startsWith("/support"),
    },
    {
      href: user ? "/notifications" : "/login?next=%2Fnotifications",
      label: t("nav.alert"),
      icon: SYMBOL_NAV_ALERT,
      badge: user ? unreadNotifications : 0,
      match: (path) => path.startsWith("/notifications"),
    },
    {
      href: "/mypage",
      label: t("nav.mypage"),
      icon: SYMBOL_NAV_PROFILE,
      badge: operatorBadge,
      match: (path) => path.startsWith("/mypage"),
    },
  ];

  return (
    <>
      <div className="social-mobile-dock lg:hidden">
        {dockExpanded && user ? (
          <div className="social-mobile-dock-panel" id="mobile-dock-panel">
            <Link
              href="/mypage"
              onClick={collapseDock}
              className="social-mobile-dock-profile"
            >
              <UserAvatar user={user} size="md" shape="round" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-gray-900">
                  {getUserNickname(user)}
                </span>
                <span className="text-ui-caption">{t("nav.mypage")}</span>
              </span>
              {user.gender ? (
                <GenderBadge
                  gender={user.gender}
                  label={
                    user.gender === "male"
                      ? t("profile.genderMale")
                      : t("profile.genderFemale")
                  }
                  compact
                />
              ) : null}
            </Link>

            <Link
              href="/support"
              onClick={collapseDock}
              className="social-mobile-dock-link relative"
            >
              <span aria-hidden>{SYMBOL_NAV_SUPPORT}</span>
              <span>{t("nav.support")}</span>
              {supportBadge > 0 ? (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {supportBadge > 99 ? "99+" : supportBadge}
                </span>
              ) : null}
            </Link>

            {isOperator ? (
              <div
                className="flex w-full rounded-full bg-white p-0.5 shadow-sm ring-1 ring-black/[0.06]"
                role="tablist"
                aria-label={t("operator.modeSwitchLabel")}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={showOperatorUI}
                  onClick={() => {
                    enterOperatorMode();
                    collapseDock();
                  }}
                  className={`text-ui-btn flex-1 rounded-full px-2 py-2 text-xs font-semibold ${
                    showOperatorUI ? "bg-[#06C755] text-white" : "text-[#65676B]"
                  }`}
                >
                  {t("operator.modeOperatorShort")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewAsUser}
                  onClick={() => {
                    enterMemberPreviewMode();
                    collapseDock();
                  }}
                  className={`text-ui-btn flex-1 rounded-full px-2 py-2 text-xs font-semibold ${
                    viewAsUser ? "bg-amber-500 text-white" : "text-[#65676B]"
                  }`}
                >
                  {t("operator.modeMemberShort")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="social-mobile-dock-bar">
          {user ? (
            <Link
              href="/mypage"
              onClick={collapseDock}
              className="social-mobile-dock-avatar"
              aria-label={t("nav.mypage")}
            >
              <UserAvatar user={user} size="sm" shape="round" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={toggleDock}
            aria-expanded={dockExpanded}
            aria-controls={user ? "mobile-dock-panel" : undefined}
            className="social-mobile-dock-toggle"
            aria-label={dockExpanded ? t("nav.collapseDock") : t("nav.expandDock")}
          >
            <span aria-hidden className={`transition-transform ${dockExpanded ? "rotate-180" : ""}`}>
              {SYMBOL_DOCK_EXPAND}
            </span>
          </button>

          <nav className="social-mobile-bottom-nav" aria-label={t("nav.home")}>
            {mobileItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={collapseDock}
                  className={`social-mobile-nav-item ${active ? "social-mobile-nav-item--active" : ""}`}
                >
                  <span className="social-mobile-nav-item__icon">
                    {item.icon}
                    {item.badge && item.badge > 0 ? (
                      <span className="social-mobile-nav-item__badge">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="social-desktop-nav hidden w-full max-w-full flex-col items-center gap-1.5 overflow-hidden lg:flex">
        <div className="flex w-full max-w-full items-center justify-center gap-1 sm:gap-1.5">
          <NavIconLink
            href={user ? "/support" : "/login?next=%2Fsupport"}
            label={t("nav.support")}
            icon={SYMBOL_NAV_SUPPORT}
            badge={supportBadge}
          />
          <NavIconLink
            href={user ? "/notifications" : "/login?next=%2Fnotifications"}
            label={t("nav.alert")}
            icon={SYMBOL_NAV_ALERT}
            badge={user ? unreadNotifications : 0}
          />
          <NavIconLink href="/" label={t("nav.home")} icon={SYMBOL_NAV_HOME} />
          <NavIconLink
            href="/mypage"
            label={t("nav.mypage")}
            icon={SYMBOL_NAV_PROFILE}
            badge={operatorBadge}
          />
        </div>

        {user ? (
          <div className="social-top-nav-extended flex w-full max-w-full flex-col items-center gap-1 pt-0.5">
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
          </div>
        ) : null}
      </div>
    </>
  );
}
