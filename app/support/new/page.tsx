"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import {
  Card,
  ErrorMessage,
  FormField,
  SubmitButton,
  inputClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import type { MessageKey } from "@/lib/i18n/messages";
import { createSupportRequest } from "@/lib/support/storage";
import type { SupportCategory } from "@/lib/support/types";

const categories: SupportCategory[] = ["board", "feature", "qa", "other"];

function categoryLabelKey(category: SupportCategory): MessageKey {
  switch (category) {
    case "board":
      return "support.catBoard";
    case "feature":
      return "support.catFeature";
    case "qa":
      return "support.catQa";
    default:
      return "support.catOther";
  }
}

function categoryDescKey(category: SupportCategory): MessageKey {
  switch (category) {
    case "board":
      return "support.catBoardDesc";
    case "feature":
      return "support.catFeatureDesc";
    case "qa":
      return "support.catQaDesc";
    default:
      return "support.catOtherDesc";
  }
}

export default function SupportNewPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, isReady } = useAuth();
  const [category, setCategory] = useState<SupportCategory>("board");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showOperatorUI } = useOperatorView();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login?next=%2Fsupport%2Fnew");
      return;
    }
    if (isReady && user && showOperatorUI) {
      router.replace("/support");
    }
  }, [isReady, user, router, showOperatorUI]);

  if (!isReady || !user || showOperatorUI) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError(t("support.errorTitle"));
      return;
    }
    if (!content.trim()) {
      setError(t("support.errorContent"));
      return;
    }

    setIsSubmitting(true);
    try {
      const request = createSupportRequest(user, {
        category,
        title,
        content,
      });
      router.push(`/support/${request.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title={t("support.newRequest")}
        backHref="/support"
        backLabel={t("support.title")}
      />

      <Card className="mb-4">
        <p className="text-sm leading-relaxed text-gray-600">{t("support.newDesc")}</p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("support.category")}>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((item) => (
                <label
                  key={item}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    category === item
                      ? "border-[#06C755] bg-[#06C755]/5 ring-2 ring-[#06C755]/30"
                      : "border-gray-100 bg-[#F8F9FA] hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={item}
                    checked={category === item}
                    onChange={() => setCategory(item)}
                    className="sr-only"
                  />
                  <span className="block text-base font-bold text-gray-900">
                    {t(categoryLabelKey(item))}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-gray-500">
                    {t(categoryDescKey(item))}
                  </span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label={t("support.requestTitle")}>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("support.requestTitlePlaceholder")}
              maxLength={80}
              className={inputClassName}
              required
            />
          </FormField>

          <FormField label={t("support.requestContent")}>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("support.requestContentPlaceholder")}
              rows={8}
              maxLength={2000}
              className={`${inputClassName} min-h-[220px] resize-y`}
              required
            />
          </FormField>

          {error && <ErrorMessage message={error} />}

          <SubmitButton disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("support.submit")}
          </SubmitButton>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/support" className="text-[#06C755]">
          {t("support.title")}
        </Link>
      </p>
    </PageShell>
  );
}
