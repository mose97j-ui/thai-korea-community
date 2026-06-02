"use client";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import { Card, SectionLabel, TopicCard, topicGridClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { boardTopics } from "@/lib/i18n/content";

export default function BoardPage() {
  const { t, pick } = useLocale();

  return (
    <PageShell maxWidth="full">
      <PageHeader compact title={t("board.title")} />

      <Card className="mb-4">
        <p className="text-sm leading-relaxed text-gray-600">{t("board.intro")}</p>
      </Card>

      <SectionLabel>{t("board.section")}</SectionLabel>
      <div className={topicGridClassName}>
        {boardTopics.map((section) => (
          <TopicCard
            key={pick(section.title)}
            icon={section.icon}
            title={pick(section.title)}
            description={pick(section.description)}
            tint={section.tint}
          />
        ))}
      </div>
    </PageShell>
  );
}
