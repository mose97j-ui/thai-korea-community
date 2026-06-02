"use client";

import Link from "next/link";
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

export default function FindIdPage() {
  const { findAccountId, getVerificationTarget } = useAuth();
  const { t, te } = useLocale();
  const [method, setMethod] = useState<VerificationMethod>("phone");
  const [contact, setContact] = useState("");
  const [verified, setVerified] = useState(false);
  const [foundEmail, setFoundEmail] = useState("");
  const [error, setError] = useState("");

  const verifyTarget = contact.trim()
    ? getVerificationTarget(method, contact)
    : null;

  const handleFind = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFoundEmail("");

    if (!verifyTarget) {
      setError(te("ACCOUNT_NOT_FOUND"));
      return;
    }

    if (!verified) {
      setError(te("VERIFY_REQUIRED"));
      return;
    }

    const result = findAccountId(method, contact);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }
    setFoundEmail(result.email);
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("findId.title")}
        backHref="/"
        backLabel={t("common.backHome")}
      />

      <Card>
        <SectionLabel>{t("findId.verify")}</SectionLabel>
        <p className="mb-4 text-sm leading-relaxed text-gray-500">
          {t("findId.hint")}
        </p>

        <form onSubmit={handleFind} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMethod("phone");
                setVerified(false);
                setFoundEmail("");
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
                setFoundEmail("");
              }}
              className={toggleButtonClassName(method === "email")}
            >
              {t("signup.verifyEmail")}
            </button>
          </div>

          <FormField
            label={
              method === "email" ? t("findId.email") : t("findId.phone")
            }
          >
            <input
              type={method === "email" ? "email" : "tel"}
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setVerified(false);
                setFoundEmail("");
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
              purpose="find-id"
              verified={verified}
              onVerified={() => setVerified(true)}
            />
          )}

          {error && <ErrorMessage message={error} />}

          {foundEmail && (
            <div className="rounded-xl bg-emerald-50 px-4 py-4 text-center ring-1 ring-emerald-100">
              <p className="text-xs text-gray-500">{t("findId.result")}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{foundEmail}</p>
            </div>
          )}

          <SubmitButton>{t("findId.submit")}</SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/account/reset-password" className="font-semibold text-[#06C755]">
          {t("login.findPassword")}
        </Link>
      </p>
    </PageShell>
  );
}
