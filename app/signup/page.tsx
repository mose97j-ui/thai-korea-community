"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthPageShell from "@/components/AuthPageShell";
import PageHeader from "@/components/PageHeader";
import ProfilePhotoField from "@/components/ProfilePhotoField";
import AccountLinks from "@/components/AccountLinks";
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
import { validateGmail } from "@/lib/auth/gmail";
import {
  SIGNUP_PROFILE_PHOTO_REQUIRED,
  SIGNUP_REFERRAL_CODE_ENABLED,
} from "@/lib/auth/features";
import type { Gender } from "@/lib/auth/types";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t, te } = useLocale();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [profileImage, setProfileImage] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [hometown, setHometown] = useState("");
  const [gmail, setGmail] = useState("");
  const [koreanPhone, setKoreanPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isKoreanMember, setIsKoreanMember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!validateGmail(gmail).ok) {
      setError(te("GMAIL_INVALID"));
      return;
    }

    if (password.length < 6) {
      setError(te("PASSWORD_SHORT"));
      return;
    }

    if (password !== passwordConfirm) {
      setError(te("PASSWORD_MISMATCH"));
      return;
    }

    if (gender !== "male" && gender !== "female") {
      setError(te("GENDER_REQUIRED"));
      return;
    }

    if (SIGNUP_PROFILE_PHOTO_REQUIRED && !profileImage) {
      setError(te("PROFILE_REQUIRED"));
      return;
    }

    setSubmitting(true);

    const result = signup({
      name,
      nickname,
      gender,
      profileImage: profileImage.trim() || undefined,
      birthDate,
      hometown,
      gmail,
      koreanPhone,
      password,
      referralCode:
        SIGNUP_REFERRAL_CODE_ENABLED && referralCode.trim()
          ? referralCode.trim()
          : undefined,
      isKoreanMember,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    router.push("/");
  };

  return (
    <AuthPageShell topAligned centerContent={false}>
      <PageHeader title={t("signup.titleEn")} backLabel={t("common.back")} />

      <Card className="mb-4">
        <p className="text-base leading-relaxed text-gray-600">{t("signup.note")}</p>
        <p className="mt-2 text-sm text-gray-500">{t("signup.gmailOnlyNote")}</p>
      </Card>

      <Card>
        <SectionLabel>{t("common.account")}</SectionLabel>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label={t("signup.gmail")}>
            <input
              type="email"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              autoComplete="email"
              placeholder="example@gmail.com"
              inputMode="email"
              className={inputClassName}
              required
            />
            <p className="mt-1 text-sm text-gray-500">{t("signup.gmailHint")}</p>
          </FormField>

          <FormField label={t("signup.password")}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("signup.passwordConfirm")}>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              className={inputClassName}
              required
            />
          </FormField>

          <FormField
            label={
              SIGNUP_PROFILE_PHOTO_REQUIRED
                ? t("signup.profilePhoto")
                : `${t("signup.profilePhoto")} (${t("signup.profilePhotoOptional")})`
            }
          >
            <ProfilePhotoField
              value={profileImage}
              onChange={setProfileImage}
              previewUser={{ name, nickname, role: "user" }}
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
              autoComplete="tel"
              className={inputClassName}
              required
            />
            <p className="mt-1 text-sm text-gray-500">{t("signup.phoneHint")}</p>
          </FormField>

          {SIGNUP_REFERRAL_CODE_ENABLED ? (
            <>
              <FormField label={t("signup.referral")}>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="CAPTAINKOREA97"
                  className={inputClassName}
                />
              </FormField>

              <p className="text-sm text-gray-500">{t("signup.codeNote")}</p>
            </>
          ) : null}

          {error && <ErrorMessage message={error} />}

          <FormField label={t("signup.isKoreanMember")}>
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
              <input
                type="checkbox"
                checked={isKoreanMember}
                onChange={(e) => setIsKoreanMember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{t("signup.isKoreanMemberHint")}</span>
            </label>
          </FormField>

          <SubmitButton disabled={submitting}>
            {submitting ? t("common.loading") : t("signup.submitEn")}
          </SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-base text-gray-500">
        {t("signup.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#06C755]">
          {t("login.submitEn")}
        </Link>
      </p>

      <AccountLinks showSignup={false} showLogin={false} />
    </AuthPageShell>
  );
}
