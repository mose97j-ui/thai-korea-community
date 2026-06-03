"use client";

import Image from "next/image";
import Link from "next/link";
import AccountLinks from "@/components/AccountLinks";
import AuthPageShell from "@/components/AuthPageShell";
import BilingualText from "@/components/BilingualText";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Card, SectionLabel, secondaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { siteNameClass } from "@/lib/i18n/typography";

export default function WelcomeScreen() {
  const { t, locale } = useLocale();
  const bilingual = locale === "th";

  return (
    <AuthPageShell centerContent>
      <div className="mb-5 flex flex-col items-center gap-4">
        <Link
          href="/"
          aria-label={t("nav.home")}
          className="shrink-0 rounded-[35px] transition active:scale-[0.97]"
        >
          <Image
            src="/logo.png"
            alt="Thai Korea Community"
            width={120}
            height={120}
            priority
            className="h-[120px] w-[120px] rounded-[35px] object-cover shadow-sm ring-1 ring-black/5"
          />
        </Link>
        <div>
          <h1 className={`${siteNameClass} text-3xl sm:text-4xl`}>
            Thai Korea
            <br />
            Community
          </h1>
          <p className="text-ui-caption mx-auto mt-3 max-w-sm">
            {bilingual ? (
              <BilingualText messageKey="welcome.subtitle" layout="stack" />
            ) : (
              t("welcome.subtitle")
            )}
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <p className="text-ui-body leading-relaxed text-gray-600">
          {bilingual ? (
            <BilingualText messageKey="welcome.note" layout="stack" />
          ) : (
            t("welcome.note")
          )}
        </p>
      </Card>

      <Card>
        <SectionLabel>{t("common.account")}</SectionLabel>
        <p className="mb-4 text-base text-gray-600">{t("auth.googleOnlyNote")}</p>
        <div className="space-y-3">
          <GoogleSignInButton
            nextPath="/signup/complete"
            labelKey="auth.googleSignup"
          />
          <Link
            href="/login"
            className={`w-full flex-col gap-1 py-5 ${secondaryButtonClassName}`}
          >
            {bilingual ? (
              <BilingualText messageKey="welcome.login" layout="stack" />
            ) : (
              t("welcome.login")
            )}
          </Link>
        </div>
      </Card>

      <AccountLinks
        showSignup={false}
        bilingual={bilingual}
        className="mt-5"
      />

      <p className="text-ui-caption mt-4 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-[#06C755]">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-[#06C755]">
          Terms
        </Link>
      </p>
    </AuthPageShell>
  );
}
