"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import VerificationBlock from "@/components/VerificationBlock";
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
import type { VerificationMethod } from "@/lib/auth/verification";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword, getVerificationTarget } = useAuth();
  const { t, te } = useLocale();
  const [method, setMethod] = useState<VerificationMethod>("phone");
  const [contact, setContact] = useState("");
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const verifyTarget = contact.trim()
    ? getVerificationTarget(method, contact)
    : null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!verifyTarget) {
      setError(te("ACCOUNT_NOT_FOUND"));
      return;
    }

    if (!verified) {
      setError(te("VERIFY_REQUIRED"));
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError(te("PASSWORD_MISMATCH"));
      return;
    }

    const result = resetPassword(method, contact, newPassword);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("resetPassword.title")}
        backHref="/"
        backLabel={t("common.backHome")}
      />

      <Card>
        <SectionLabel>{t("resetPassword.title")}</SectionLabel>
        <p className="mb-4 text-sm leading-relaxed text-gray-500">
          {t("resetPassword.hint")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setVerified(false);
              }}
              className={toggleButtonClassName(method === "phone")}
            >
              {t("signup.verifyPhone")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod("email");
                setVerified(false);
              }}
              className={toggleButtonClassName(method === "email")}
            >
              {t("signup.verifyEmail")}
            </button>
          </div>

          <FormField
            label={
              method === "email"
                ? t("resetPassword.email")
                : t("resetPassword.phone")
            }
          >
            <input
              type={method === "email" ? "email" : "tel"}
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setVerified(false);
              }}
              placeholder={
                method === "email" ? "example@gmail.com" : "01012345678"
              }
              className={inputClassName}
              required
            />
          </FormField>

          {contact.trim() && !verifyTarget && (
            <ErrorMessage message={te("ACCOUNT_NOT_FOUND")} />
          )}

          {verifyTarget && (
            <VerificationBlock
              target={verifyTarget}
              method={method}
              purpose="reset-password"
              verified={verified}
              onVerified={() => setVerified(true)}
            />
          )}

          <FormField label={t("resetPassword.newPassword")}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("resetPassword.confirm")}>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              minLength={6}
              className={inputClassName}
              required
            />
          </FormField>

          {error && <ErrorMessage message={error} />}
          {success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
              {t("resetPassword.success")}
            </p>
          )}

          <SubmitButton>{t("resetPassword.submit")}</SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/account/find-id" className="font-semibold text-[#06C755]">
          {t("login.findId")}
        </Link>
      </p>
    </PageShell>
  );
}
