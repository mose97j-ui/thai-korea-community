"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card, primaryButtonClassName, secondaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

function PaymentFailContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const code = searchParams.get("code");

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("premium.paymentFailTitle")}
        backHref="/premium"
        backLabel={t("premium.pageTitle")}
      />

      <Card className="py-10 text-center">
        <p className="text-5xl">😢</p>
        <p className="mt-4 text-xl font-bold text-gray-900">
          {t("premium.paymentFail")}
        </p>
        <p className="mt-2 text-base text-gray-500">
          {message || code || t("premium.paymentFailDesc")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/premium" className={primaryButtonClassName}>
            {t("premium.retryPayment")}
          </Link>
          <Link href="/" className={secondaryButtonClassName}>
            {t("common.backHome")}
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}

export default function PremiumPaymentFailPage() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <PageShell maxWidth="2xl">
          <Card className="py-10 text-center text-base text-gray-500">
            {t("common.loading")}
          </Card>
        </PageShell>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
