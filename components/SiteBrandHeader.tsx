"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageStickyHeaderClassName } from "@/components/PageShell";
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
      className={`${pageStickyHeaderClassName} pl-3 pt-2 pb-2 lg:pl-[var(--social-shell-pl)] lg:pt-[var(--social-shell-pt)] lg:pb-2.5`}
    >
      <Link
        href="/"
        aria-label={t("nav.home")}
        className="flex min-w-0 items-center gap-2.5 transition active:scale-[0.99] lg:gap-3"
      >
        <Image
          src="/logo.png"
          alt="Thai Korea Community"
          width={48}
          height={48}
          className="h-9 w-9 shrink-0 rounded-[14px] object-cover shadow-sm ring-1 ring-black/5 lg:h-12 lg:w-12 lg:rounded-[16px]"
        />
        <span
          className={`${siteNameClass} line-clamp-1 text-left text-base leading-tight lg:line-clamp-2 lg:text-xl`}
        >
          Thai Korea Community
        </span>
      </Link>
    </header>
  );
}
