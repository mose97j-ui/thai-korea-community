"use client";

import PremiumPaywall from "@/components/PremiumPaywall";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { isPremiumCategoryId } from "@/lib/categories/registry";

type PremiumGateProps = {
  categoryId: string;
  children: React.ReactNode;
  backHref?: string;
};

export default function PremiumGate({
  categoryId,
  children,
  backHref = "/",
}: PremiumGateProps) {
  const { t } = useLocale();
  const { isReady, hasAccess } = usePremiumAccess();

  if (!isPremiumCategoryId(categoryId)) {
    return children;
  }

  if (!isReady) {
    return (
      <Card className="py-10 text-center text-base text-gray-500">
        {t("common.loading")}
      </Card>
    );
  }

  if (!hasAccess) {
    return <PremiumPaywall variant="inline" backHref={backHref} />;
  }

  return children;
}
