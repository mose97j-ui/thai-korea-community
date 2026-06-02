"use client";

import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import SearchResultsContent from "@/components/SearchResultsContent";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

function SearchFallback() {
  const { t } = useLocale();
  return (
    <Card className="py-10 text-center text-base text-gray-500">
      {t("common.loading")}
    </Card>
  );
}

export default function SearchPage() {
  return (
    <PageShell maxWidth="full">
      <Suspense fallback={<SearchFallback />}>
        <SearchResultsContent />
      </Suspense>
    </PageShell>
  );
}
