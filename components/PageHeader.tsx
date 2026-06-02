"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { pillSecondaryButtonClassName } from "@/components/ui";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  /** Category / board pages: title + back only. */
  compact?: boolean;
};

export default function PageHeader({
  title,
  backHref = "/",
  backLabel,
  compact = false,
}: PageHeaderProps) {
  const { t } = useLocale();

  if (compact) {
    return (
      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-ui-headline min-w-0 flex-1 text-lg leading-snug sm:text-xl">
          {title}
        </h1>
        <Link
          href={backHref}
          className={`shrink-0 self-start sm:self-center ${pillSecondaryButtonClassName}`}
        >
          ← {backLabel ?? t("common.backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-3 min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h1 className="text-ui-headline min-w-0 flex-1 text-lg leading-snug sm:text-xl">
          {title}
        </h1>
        <Link
          href={backHref}
          className={`hidden shrink-0 sm:inline-flex ${pillSecondaryButtonClassName}`}
        >
          ← {backLabel ?? t("common.backHome")}
        </Link>
      </div>
      <Link
        href={backHref}
        className={`mt-2 inline-flex sm:hidden ${pillSecondaryButtonClassName}`}
      >
        ← {backLabel ?? t("common.backHome")}
      </Link>
    </div>
  );
}
