"use client";

import PageShell, { socialPageTwoColumnClassName } from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import { Card, SectionLabel, TipBox, TopicCard, topicGridClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { jobTips, jobTopics } from "@/lib/i18n/content";

export default function JobsPage() {
  const { t, pick, locale } = useLocale();

  return (
    <PageShell maxWidth="full">
      <PageHeader compact title={t("jobs.title")} />

      <Card className="mb-4">
        <p className="text-sm leading-relaxed text-gray-600">{t("jobs.intro")}</p>
      </Card>

      <div className={socialPageTwoColumnClassName}>
        <div>
          <SectionLabel>{t("jobs.section")}</SectionLabel>
          <div className={topicGridClassName}>
            {jobTopics.map((topic) => (
              <TopicCard
                key={pick(topic.title)}
                icon={topic.icon}
                title={pick(topic.title)}
                description={pick(topic.description)}
                tint={topic.tint}
              />
            ))}
          </div>
        </div>
        <TipBox title={t("jobs.tipsTitle")} items={jobTips[locale]} />
      </div>
    </PageShell>
  );
}
