"use client";

import Image from "next/image";
import Link from "next/link";
import AccountLinks from "@/components/AccountLinks";
import BilingualText from "@/components/BilingualText";
import AppShell from "@/components/AppShell";
import { shellPaddingClassName } from "@/components/PageShell";
import { useLocale } from "@/contexts/LocaleContext";
import { siteNameClass } from "@/lib/i18n/typography";
import { primaryButtonClassName, secondaryButtonClassName } from "@/components/ui";

export default function WelcomeScreen() {
  const { t, locale } = useLocale();
  const bilingual = locale === "th";

  return (
    <AppShell>
      <div className={`${shellPaddingClassName} py-4 sm:py-6`}>
        <div className="flex w-full max-w-none flex-col items-center">
          <div className="mb-6 flex w-full flex-col items-center gap-4 text-center">
            <Link
              href="/"
              aria-label={t("nav.home")}
              className="shrink-0 rounded-[35px] transition active:scale-[0.97]"
            >
              <Image
                src="/logo.png"
                alt="Thai Korea Community"
                width={130}
                height={130}
                className="h-[130px] w-[130px] rounded-[35px] object-cover shadow-sm ring-1 ring-black/5"
              />
            </Link>
            <div className="w-full">
              <h1 className={`${siteNameClass} text-4xl sm:text-5xl`}>
                Thai Korea
                <br />
                Community
              </h1>
              <p className="text-ui-caption mx-auto mt-3 max-w-md sm:mt-4">
                {bilingual ? (
                  <BilingualText messageKey="welcome.subtitle" layout="stack" />
                ) : (
                  t("welcome.subtitle")
                )}
              </p>
            </div>
          </div>

          <p className="text-ui-body mb-6 max-w-none text-center">
            {bilingual ? (
              <BilingualText messageKey="welcome.note" layout="stack" />
            ) : (
              t("welcome.note")
            )}
          </p>

          <div className="w-full space-y-5">
            <Link
              href="/login"
              className={`w-full flex-col gap-1 py-6 ${primaryButtonClassName}`}
            >
              {bilingual ? (
                <BilingualText
                  messageKey="welcome.login"
                  layout="stack"
                  secondaryClassName="text-white/90"
                />
              ) : (
                t("welcome.login")
              )}
            </Link>
            <Link
              href="/signup"
              className={`w-full flex-col gap-1 py-6 ${secondaryButtonClassName}`}
            >
              {bilingual ? (
                <BilingualText messageKey="signup.title" layout="stack" />
              ) : (
                t("signup.title")
              )}
            </Link>

            <AccountLinks
              showSignup={false}
              bilingual={bilingual}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
