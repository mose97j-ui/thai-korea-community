"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import ProfilePhotoField from "@/components/ProfilePhotoField";
import {
  Card,
  ErrorMessage,
  FeedSection,
  FormField,
  SectionLabel,
  cardGridClassName,
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  settingsLinkClassName,
  pillSecondaryButtonClassName,
  sectionStackClassName,
  SubmitButton,
  inputClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatAgeLabel, getUserBirthDate } from "@/lib/auth/age";
import { formatPhone } from "@/lib/auth/phone";
import { getUserNickname } from "@/lib/auth/profileImage";
import { useOperatorView } from "@/hooks/useOperatorView";
import UserAvatar from "@/components/UserAvatar";
import MyActivityPanel from "@/components/MyActivityPanel";
import OperatorPreviewChecklist from "@/components/OperatorPreviewChecklist";
import OperatorAnalyticsPanel from "@/components/OperatorAnalyticsPanel";
import OperatorRecentMembersPanel from "@/components/OperatorRecentMembersPanel";
import OperatorModerationPanel from "@/components/OperatorModerationPanel";
import OperatorRecentPostsPanel from "@/components/OperatorRecentPostsPanel";
import OperatorReportsPanel from "@/components/OperatorReportsPanel";
import OperatorSupportPanel from "@/components/OperatorSupportPanel";
import ModerationNotice from "@/components/ModerationNotice";
import { getActiveRestriction } from "@/lib/auth/moderation";
import { getCategoryOverviewHref } from "@/lib/i18n/content";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="social-list-row flex items-start justify-between gap-4 !py-3.5">
      <span className="text-ui-caption shrink-0">{label}</span>
      <span className="text-ui-title text-right">{value}</span>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { user, isReady, logout, applyReferralCode, updateProfileImage } = useAuth();
  const { t, te, locale } = useLocale();
  const { hasAccess: hasPremiumAccess, premiumUntilLabel, status: premiumStatus } =
    usePremiumAccess();
  const [referralInput, setReferralInput] = useState("");
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const { showOperatorUI } = useOperatorView();

  if (!isReady) {
    return (
      <PageShell>
        <PageHeader title={t("mypage.title")} />
        <Card className="py-10 text-center text-sm text-gray-500">
          {t("common.loading")}
        </Card>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <PageHeader title={t("mypage.title")} />

        <Card className="text-center">
          <div className="mb-4 text-5xl">👤</div>
          <p className="mb-2 text-sm font-semibold text-gray-900">
            {t("mypage.loginRequired")}
          </p>
          <p className="mb-6 text-sm text-gray-500">{t("mypage.loginDesc")}</p>
          <div className="space-y-3">
            <Link href="/login" className={`w-full ${primaryButtonClassName}`}>
              {t("welcome.login")}
            </Link>
            <Link href="/signup" className={`w-full ${secondaryButtonClassName}`}>
              {t("welcome.signup")}
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(user.personalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReferralSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReferralError("");
    setReferralSuccess("");

    const result = applyReferralCode(referralInput);
    if (!result.ok) {
      setReferralError(te(result.errorKey));
      return;
    }
    setReferralSuccess(te("REFERRAL_SUCCESS"));
    setReferralInput("");
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleProfileImageChange = (dataUrl: string) => {
    setProfileError("");
    setProfileSuccess("");

    const result = updateProfileImage(dataUrl);
    if (!result.ok) {
      setProfileError(te(result.errorKey));
      return;
    }
    setProfileSuccess(t("mypage.profilePhotoSaved"));
  };

  return (
    <PageShell maxWidth="full">
      <PageHeader title={t("mypage.title")} />

      <div className={sectionStackClassName}>
        <OperatorPreviewChecklist />

        <MyActivityPanel />

        {showOperatorUI && (
          <FeedSection tone="green" icon="👑" title={t("mypage.operator")} description={t("mypage.operatorDesc")}>
            <div className={sectionStackClassName}>
              <OperatorRecentMembersPanel />
              <OperatorAnalyticsPanel />
              <OperatorRecentPostsPanel />
              <OperatorSupportPanel />
              <OperatorReportsPanel />
              <OperatorModerationPanel />
            </div>
          </FeedSection>
        )}

        {getActiveRestriction(user) && (
          <ModerationNotice user={user} />
        )}

        <FeedSection tone="sky" icon="📮" title={t("support.title")} description={t("support.mypageDesc")}>
          <Link href="/support" className={`inline-flex ${pillSecondaryButtonClassName}`}>
            📮 {t("support.title")}
          </Link>
        </FeedSection>

        <FeedSection tone="default" icon="👤" title={t("mypage.profile")}>
          <div className={cardGridClassName}>
            <Card className="!shadow-none ring-1 ring-black/[0.05]">
              <SectionLabel>{t("mypage.profilePhoto")}</SectionLabel>
              <ProfilePhotoField
                value={user.profileImage ?? ""}
                onChange={handleProfileImageChange}
                previewUser={user}
                shape="square"
              />
              {profileError && <ErrorMessage message={profileError} />}
              {profileSuccess && (
                <p className="text-ui-body mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-100">
                  {profileSuccess}
                </p>
              )}
            </Card>

            <Card className="!shadow-none ring-1 ring-black/[0.05]">
              <div className="mb-4 flex items-center gap-4 border-b border-black/[0.06] pb-4">
                <UserAvatar user={user} size="lg" shape="square" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-ui-title text-xl">{getUserNickname(user)}</p>
                    {showOperatorUI && (
                      <span className="rounded-full bg-[#06C755]/10 px-2.5 py-1 text-xs font-semibold text-[#06C755]">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-ui-body mt-1">{user.gmail}</p>
                  <p className="text-ui-caption mt-0.5">{user.name}</p>
                </div>
              </div>

              <InfoRow label={t("mypage.nickname")} value={getUserNickname(user)} />
              <InfoRow label={t("mypage.name")} value={user.name} />
              <InfoRow label={t("mypage.age")} value={formatAgeLabel(user, locale)} />
              <InfoRow label={t("mypage.birthDate")} value={getUserBirthDate(user)} />
              <InfoRow label={t("mypage.hometown")} value={user.hometown} />
              <InfoRow label="Gmail" value={user.gmail} />
              <InfoRow label={t("mypage.phone")} value={formatPhone(user.koreanPhone)} />
              {user.referredBy && (
                <InfoRow label={t("mypage.referrer")} value={user.referredBy} />
              )}
            </Card>
          </div>
        </FeedSection>

        <FeedSection tone="amber" icon="🎁" title={t("mypage.personalCode")}>
          <div className="social-zone social-zone--amber flex items-center justify-between gap-3 rounded-xl px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-wider text-[#06C755]">
              {user.personalCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`shrink-0 ${pillSecondaryButtonClassName} px-5 py-2.5 text-base`}
            >
              {copied ? t("common.copied") : t("common.copy")}
            </button>
          </div>
          <p className="text-ui-caption mt-3">
            {showOperatorUI ? t("mypage.operatorCodeShare") : t("mypage.codeShare")}
          </p>
        </FeedSection>

        <FeedSection tone="amber" icon="👑" title={t("premium.pageTitle")}>
          {hasPremiumAccess && premiumUntilLabel ? (
            <>
              <p className="text-ui-title">{t("premium.active")}</p>
              {premiumUntilLabel && !showOperatorUI ? (
                <p className="text-ui-body mt-2">
                  {t("premium.until").replace("{date}", premiumUntilLabel)}
                </p>
              ) : showOperatorUI ? (
                <p className="text-ui-body mt-2">{t("mypage.operatorPremiumAccess")}</p>
              ) : null}
              <Link
                href={getCategoryOverviewHref("premium")}
                className={`mt-4 inline-flex ${primaryButtonClassName}`}
              >
                {t("premium.enter")}
              </Link>
            </>
          ) : (
            <>
              <p className="text-ui-body">
                {premiumStatus === "expired"
                  ? t("premium.expiredDesc")
                  : t("premium.upsellDesc")}
              </p>
              <Link href="/premium" className={`mt-4 inline-flex ${primaryButtonClassName}`}>
                {t("premium.viewPlans")}
              </Link>
            </>
          )}
        </FeedSection>

        {!user.referredBy && (
          <FeedSection tone="green" icon="🤝" title={t("mypage.referralInput")}>
            <form onSubmit={handleReferralSubmit} className="space-y-3">
              <FormField label={t("mypage.referralPlaceholder")}>
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="TKXXXXXX"
                  className={inputClassName}
                />
              </FormField>
              {referralError && <ErrorMessage message={referralError} />}
              {referralSuccess && (
                <p className="text-ui-body rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-100">
                  {referralSuccess}
                </p>
              )}
              <SubmitButton>{t("mypage.referralSubmit")}</SubmitButton>
            </form>
          </FeedSection>
        )}

        <FeedSection tone="slate" icon="⚙️" title={t("mypage.settings")}>
          <div className="space-y-2">
            <Link href="/mypage/change-password" className={settingsLinkClassName}>
              <span>{t("mypage.changePassword")}</span>
              <span className="text-gray-300">›</span>
            </Link>
            <Link href="/mypage/change-phone" className={settingsLinkClassName}>
              <span>{t("mypage.changePhone")}</span>
              <span className="text-gray-300">›</span>
            </Link>
          </div>
        </FeedSection>

        <button type="button" onClick={handleLogout} className={dangerButtonClassName}>
          {t("mypage.logout")}
        </button>
      </div>
    </PageShell>
  );
}
