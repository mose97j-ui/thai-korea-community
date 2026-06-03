"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountLinks from "@/components/AccountLinks";
import AuthPageShell from "@/components/AuthPageShell";
import PageHeader from "@/components/PageHeader";
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
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth/features";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t, te } = useLocale();
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      const reason = searchParams.get("reason");
      setError(reason ? `${t("login.authError")} (${reason})` : t("login.authError"));
    }
  }, [searchParams, t]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const result = login({ gmail, password });

    setSubmitting(false);

    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }

    router.push(nextPath.startsWith("/") ? nextPath : "/");
  };

  return (
    <AuthPageShell centerContent>
      <PageHeader title={t("login.title")} backLabel={t("common.back")} />

      <Card>
        <SectionLabel>{t("common.account")}</SectionLabel>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("login.gmail")}>
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

          <FormField label={t("login.password")}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClassName}
              required
            />
          </FormField>

          {error && <ErrorMessage message={error} />}

          <SubmitButton disabled={submitting}>
            {submitting ? t("common.loading") : t("login.submit")}
          </SubmitButton>
        </form>

        {GOOGLE_AUTH_ENABLED ? (
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-gray-500">{t("auth.googleOnlyNote")}</p>
            <GoogleSignInButton nextPath={nextPath} labelKey="auth.googleLogin" />
          </div>
        ) : null}
      </Card>

      <p className="mt-4 text-center text-base text-gray-500">
        {t("login.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-[#06C755]">
          {t("login.signupLink")}
        </Link>
      </p>

      <AccountLinks />
    </AuthPageShell>
  );
}

function LoginFallback() {
  const { t } = useLocale();

  return (
    <AuthPageShell centerContent>
      <Card className="py-10 text-center text-base text-gray-500">{t("common.loading")}</Card>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
