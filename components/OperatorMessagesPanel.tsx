"use client";

import Link from "next/link";
import { Card, pillButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

export default function OperatorMessagesPanel() {
  const { t } = useLocale();

  return (
    <Card className="mb-4 border-l-4 border-l-emerald-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-gray-900">{t("support.operatorPanelTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {t("support.operatorPanelDesc")}
          </p>
        </div>
        <Link href="/support" className={pillButtonClassName}>
          {t("support.viewAll")}
        </Link>
      </div>
      <p className="mt-4 text-sm text-gray-500">{t("support.mypageDesc")}</p>
    </Card>
  );
}
