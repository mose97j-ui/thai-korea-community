"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { pillSecondaryButtonClassName } from "@/components/ui";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
};

export default function PageHeader({
  title,
  backHref = "/",
  backLabel,
}: PageHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="mb-3 flex min-w-0 flex-row items-start justify-between gap-2">
      <h1 className="text-ui-headline min-w-0 flex-1 text-lg leading-snug sm:text-xl">
        {title}
      </h1>
      <Link
        href={backHref}
        className={`shrink-0 self-center ${pillSecondaryButtonClassName}`}
      >
        ← {backLabel ?? t("common.backHome")}
      </Link>
    </div>
  );
}
