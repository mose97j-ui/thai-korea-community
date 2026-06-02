"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageStickyHeaderClassName, shellPaddingClassName } from "@/components/PageShell";
import { useLocale } from "@/contexts/LocaleContext";
import { siteNameClass } from "@/lib/i18n/typography";

/** Site logo + name — top-left on every page except home (`/`). */
export default function SiteBrandHeader() {
  const pathname = usePathname();
  const { t } = useLocale();

  if (pathname === "/") {
    return null;
  }

  return (
    <header
      className={`${pageStickyHeaderClassName} ${shellPaddingClassName} !pb-2.5 !pt-[var(--social-shell-pt)]`}
    >
      <Link
        href="/"
        aria-label={t("nav.home")}
        className="flex min-w-0 items-center gap-3 transition active:scale-[0.99]"
      >
        <Image
          src="/logo.png"
          alt="Thai Korea Community"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-[16px] object-cover shadow-sm ring-1 ring-black/5"
        />
        <span className={`${siteNameClass} line-clamp-2 text-left text-lg leading-tight sm:text-xl`}>
          Thai Korea Community
        </span>
      </Link>
    </header>
  );
}
