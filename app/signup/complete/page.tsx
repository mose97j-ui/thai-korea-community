"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PageHeader from "@/components/PageHeader";
import AuthPageShell from "@/components/AuthPageShell";
import ProfilePhotoField from "@/components/ProfilePhotoField";
import {
  Card,
  ErrorMessage,
  FormField,
  SectionLabel,
  SubmitButton,
  inputClassName,
  toggleButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import type { Gender } from "@/lib/auth/types";

export default function SignupCompletePage() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <AuthPageShell topAligned centerContent={false}>
          <Card className="py-10 text-center text-base text-gray-500">{t("common.loading")}</Card>
        </AuthPageShell>
      }
    >
      <SignupCompleteContent />
    </Suspense>
  );
}

function SignupCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady, completeGoogleSignup } = useAuth();
  const { t, te } = useLocale();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [profileImage, setProfileImage] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [hometown, setHometown] = useState("");
  const [koreanPhone, setKoreanPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const next = searchParams.get("next") || "/";

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (isProfileComplete(user)) {
      router.replace(next.startsWith("/") ? next : "/");
      return;
    }

    setName((current) => current || user.name || "");
    setNickname((current) => current || user.nickname || "");
    setProfileImage((current) => current || user.profileImage || "");
    setBirthDate((current) => current || user.birthDate || "");
    setHometown((current) => current || user.hometown || "");
    setKoreanPhone((current) => current || user.koreanPhone || "");
    if (user.gender === "male" || user.gender === "female") {
      setGender(user.gender);
    }
  }, [isReady, user, router, searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!user) {
      return;
    }

    if (!profileImage) {
      setError(te("PROFILE_REQUIRED"));
      return;
    }

    if (gender !== "male" && gender !== "female") {
      setError(te("GENDER_REQUIRED"));
      return;
    }

    setSubmitting(true);

    const result = await completeGoogleSignup({
      name,
      nickname,
      gender,
      profileImage,
      birthDate,
      hometown,
      koreanPhone,
      referralCode: referralCode.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next.startsWith("/") ? next : "/");
  };

  if (!isReady) {
    return (
      <AuthPageShell topAligned centerContent={false}>
        <Card className="py-12 text-center text-lg text-gray-600">{t("common.loading")}</Card>
      </AuthPageShell>
    );
  }

  if (!user) {
    return (
      <AuthPageShell topAligned centerContent={false}>
        <PageHeader title={t("signup.complete.title")} backLabel={t("common.back")} />
        <Card className="space-y-4">
          <p className="text-base text-gray-600">{t("signup.complete.loginRequired")}</p>
          <GoogleSignInButton
            nextPath={searchParams.get("next") || "/signup/complete"}
            labelKey="auth.googleSignup"
          />
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell topAligned centerContent={false}>
      <PageHeader title={t("signup.complete.title")} backLabel={t("common.back")} />

      <Card className="mb-4">
        <p className="text-base leading-relaxed text-gray-600">{t("signup.complete.note")}</p>
      </Card>

      <Card>
        <SectionLabel>{t("mypage.profile")}</SectionLabel>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label={t("signup.gmail")}>
            <input
              type="email"
              value={user.gmail}
              readOnly
              className={`${inputClassName} bg-gray-50 text-gray-500`}
            />
          </FormField>

          <FormField label={t("signup.profilePhoto")}>
            <ProfilePhotoField
              value={profileImage}
              onChange={setProfileImage}
              previewUser={{ name, nickname, role: user.role ?? "user" }}
            />
          </FormField>

          <FormField label={t("signup.nickname")}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("signup.nicknamePlaceholder")}
              maxLength={16}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.gender")}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={toggleButtonClassName(gender === "male")}
              >
                ♂ {t("signup.genderMale")}
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={toggleButtonClassName(gender === "female")}
              >
                ♀ {t("signup.genderFemale")}
              </button>
            </div>
          </FormField>

          <FormField label={t("signup.name")}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.birthDate")}>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.hometown")}>
            <input
              type="text"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.phone")}>
            <input
              type="tel"
              value={koreanPhone}
              onChange={(e) => setKoreanPhone(e.target.value)}
              placeholder="01012345678"
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.referral")}>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="CAPTAINKOREA97"
              className={inputClassName}
            />
          </FormField>

          {error && <ErrorMessage message={error} />}

          <SubmitButton disabled={submitting}>
            {submitting ? t("common.loading") : t("signup.complete.submit")}
          </SubmitButton>
        </form>
      </Card>
    </AuthPageShell>
  );
}
