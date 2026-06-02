"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  Card,
  ErrorMessage,
  FormField,
  SubmitButton,
  inputClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isReady, changePassword } = useAuth();
  const { t, te } = useLocale();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
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

    if (newPassword !== newPasswordConfirm) {
      setError(te("PASSWORD_MISMATCH"));
      return;
    }

    const result = changePassword(currentPassword, newPassword);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("changePassword.title")}
        backHref="/mypage"
        backLabel={t("common.backMypage")}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("changePassword.current")}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("changePassword.new")}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("changePassword.confirm")}>
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
              {t("changePassword.success")}
            </p>
          )}

          <SubmitButton>{t("changePassword.submit")}</SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm">
        <Link href="/mypage" className="text-[#06C755]">
          {t("changePassword.back")}
        </Link>
      </p>
    </PageShell>
  );
}
