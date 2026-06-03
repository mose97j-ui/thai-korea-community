"use client";

import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthPageShell from "@/components/AuthPageShell";
import PageHeader from "@/components/PageHeader";
import AccountLinks from "@/components/AccountLinks";
import { Card, SectionLabel } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

export default function SignupPage() {
  const { t } = useLocale();

  return (
    <AuthPageShell centerContent>
      <PageHeader title={t("signup.title")} backLabel={t("common.back")} />

      <Card className="mb-4">
        <p className="text-base leading-relaxed text-gray-600">{t("signup.note")}</p>
      </Card>

      <Card>
        <SectionLabel>{t("common.account")}</SectionLabel>
        <p className="mb-4 text-base text-gray-600">{t("auth.googleOnlyNote")}</p>
        <GoogleSignInButton nextPath="/signup/complete" labelKey="auth.googleSignup" />
      </Card>

      <p className="mt-4 text-center text-base text-gray-500">
        {t("signup.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#06C755]">
          {t("welcome.login")}
        </Link>
      </p>

      <AccountLinks showSignup={false} showLogin={false} />
    </AuthPageShell>
  );
}
