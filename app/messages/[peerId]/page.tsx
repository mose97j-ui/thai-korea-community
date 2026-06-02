"use client";

import { Suspense } from "react";
import SocialPageShell from "@/components/SocialPageShell";
import { useLocale } from "@/contexts/LocaleContext";
import MessageThreadContent from "./MessageThreadContent";

type MessageThreadPageProps = {
  params: Promise<{ peerId: string }>;
};

export default function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <SocialPageShell>
          <div className="py-16 text-center text-base text-gray-500">
            {t("common.loading")}
          </div>
        </SocialPageShell>
      }
    >
      <MessageThreadContent params={params} />
    </Suspense>
  );
}
