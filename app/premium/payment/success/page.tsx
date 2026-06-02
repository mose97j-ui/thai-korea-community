"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { Card, primaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumCheckout } from "@/hooks/usePremiumCheckout";
import { getCategoryOverviewHref } from "@/lib/i18n/content";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { t, te } = useLocale();
  const { confirmPayment } = usePremiumCheckout();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const result = await confirmPayment({
        paymentKey: searchParams.get("paymentKey"),
        orderId: searchParams.get("orderId"),
        amount: searchParams.get("amount"),
      });

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setError(te(result.errorKey));
        return;
      }

      setDone(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [confirmPayment, searchParams, te]);

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title={t("premium.paymentSuccessTitle")}
        backHref="/premium"
        backLabel={t("premium.pageTitle")}
      />

      <Card className="py-10 text-center">
        {error ? (
          <>
            <p className="text-4xl">⚠️</p>
            <p className="mt-4 text-base text-red-600">{error}</p>
            <Link href="/premium" className={`mt-6 inline-flex ${primaryButtonClassName}`}>
              {t("premium.viewPlans")}
            </Link>
          </>
        ) : done ? (
          <>
            <p className="text-5xl">👑</p>
            <p className="mt-4 text-xl font-bold text-gray-900">
              {t("premium.paymentSuccess")}
            </p>
            <p className="mt-2 text-base text-gray-500">
              {t("premium.paymentSuccessDesc")}
            </p>
            <Link
              href={getCategoryOverviewHref("premium")}
              className={`mt-6 inline-flex ${primaryButtonClassName}`}
            >
              {t("premium.enter")}
            </Link>
          </>
        ) : (
          <p className="text-base text-gray-500">{t("premium.processing")}</p>
        )}
      </Card>
    </PageShell>
  );
}

export default function PremiumPaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
