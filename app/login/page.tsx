"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AccountLinks from "@/components/AccountLinks";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthPageShell from "@/components/AuthPageShell";
import PageHeader from "@/components/PageHeader";
import { Card, ErrorMessage, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      const reason = searchParams.get("reason");
      setError(reason ? `${t("login.authError")} (${reason})` : t("login.authError"));
    }
  }, [searchParams, t]);

  return (
    <AuthPageShell centerContent>
      <PageHeader title={t("login.title")} backLabel={t("common.back")} />

      <Card>
        <SectionLabel>{t("common.account")}</SectionLabel>
        <p className="mb-4 text-base text-gray-600">{t("auth.googleOnlyNote")}</p>

        <GoogleSignInButton nextPath={nextPath} labelKey="auth.googleLogin" />

        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
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
