"use client";

import Link from "next/link";
import BilingualText from "@/components/BilingualText";
import { useLocale } from "@/contexts/LocaleContext";
import type { MessageKey } from "@/lib/i18n/messages";

type AccountLinksProps = {
  showSignup?: boolean;
  showLogin?: boolean;
  bilingual?: boolean;
  className?: string;
};

function LinkLabel({
  messageKey,
  bilingual,
  emphasized,
}: {
  messageKey: MessageKey;
  bilingual?: boolean;
  emphasized?: boolean;
}) {
  const { t } = useLocale();

  if (bilingual) {
    return (
      <BilingualText
        messageKey={messageKey}
        layout="stack"
        className={emphasized ? "font-semibold text-[#06C755]" : ""}
        secondaryClassName={emphasized ? "font-semibold text-[#06C755]/80" : "text-gray-500"}
      />
    );
  }

  return (
    <span className={emphasized ? "font-semibold text-[#06C755]" : undefined}>
      {t(messageKey)}
    </span>
  );
}

export default function AccountLinks({
  showSignup = true,
  showLogin = false,
  bilingual = false,
  className = "mt-5",
}: AccountLinksProps) {
  const { t } = useLocale();

  if (bilingual) {
    return (
      <div
        className={`flex flex-col items-center gap-4 text-lg text-gray-500 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Link href="/account/find-id" className="text-center hover:text-[#06C755]">
            <LinkLabel messageKey="login.findId" bilingual />
          </Link>
          <Link
            href="/account/reset-password"
            className="text-center hover:text-[#06C755]"
          >
            <LinkLabel messageKey="login.findPassword" bilingual />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-lg text-gray-500 ${className}`}
    >
      <Link href="/account/find-id" className="hover:text-[#06C755]">
        {t("login.findId")}
      </Link>
      <span className="text-gray-300">|</span>
      <Link href="/account/reset-password" className="hover:text-[#06C755]">
        {t("login.findPassword")}
      </Link>
      {showSignup && (
        <>
          <span className="text-gray-300">|</span>
          <Link href="/signup" className="font-semibold text-[#06C755]">
            {t("login.signupLink")}
          </Link>
        </>
      )}
      {showLogin && (
        <>
          <span className="text-gray-300">|</span>
          <Link href="/login" className="font-semibold text-[#06C755]">
            {t("welcome.login")}
          </Link>
        </>
      )}
    </div>
  );
}
