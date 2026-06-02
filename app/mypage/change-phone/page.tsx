"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { formatPhone } from "@/lib/auth/phone";

export default function ChangePhonePage() {
  const router = useRouter();
  const { user, isReady, changePhone } = useAuth();
  const { t, te } = useLocale();
  const [newPhone, setNewPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!verified) {
      setError(te("VERIFY_PHONE_REQUIRED"));
      return;
    }

    const result = changePhone(newPhone);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    setSuccess(true);
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("changePhone.title")}
        backHref="/mypage"
        backLabel={t("common.backMypage")}
      />

      <Card className="mb-4">
        <p className="text-sm text-gray-600">
          {t("changePhone.current")}:{" "}
          <strong>{formatPhone(user.koreanPhone)}</strong>
        </p>
      </Card>

      <Card>
        <SectionLabel>{t("changePhone.new")}</SectionLabel>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("changePhone.new")}>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => {
                setNewPhone(e.target.value);
                setVerified(false);
              }}
              placeholder="01012345678"
              className={inputClassName}
              required
            />
          </FormField>

          <VerificationBlock
            target={newPhone}
            method="phone"
            purpose="change-phone"
            verified={verified}
            onVerified={() => setVerified(true)}
            disabled={!newPhone.trim()}
          />

          {error && <ErrorMessage message={error} />}
          {success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
              {t("changePhone.success")}
            </p>
          )}

          <SubmitButton>{t("changePhone.submit")}</SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm">
        <Link href="/mypage" className="text-[#06C755]">
          {t("changePhone.back")}
        </Link>
      </p>
    </PageShell>
  );
}
