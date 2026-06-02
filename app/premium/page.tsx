"use client";

import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PremiumPaywall from "@/components/PremiumPaywall";
import { useLocale } from "@/contexts/LocaleContext";

export default function PremiumPage() {
  const { t } = useLocale();

  return (
    <PageShell maxWidth="full">
      <PageHeader title={t("premium.pageTitle")} backHref="/" backLabel={t("common.backHome")} />
      <PremiumPaywall variant="page" />
    </PageShell>
  );
}
