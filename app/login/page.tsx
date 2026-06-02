"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AccountLinks from "@/components/AccountLinks";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card, ErrorMessage, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError(t("login.authError"));
    }
  }, [searchParams, t]);

  return (
    <PageShell maxWidth="2xl">
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
    </PageShell>
  );
}

function LoginFallback() {
  const { t } = useLocale();

  return (
    <PageShell maxWidth="2xl">
      <Card className="py-10 text-center text-base text-gray-500">{t("common.loading")}</Card>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
