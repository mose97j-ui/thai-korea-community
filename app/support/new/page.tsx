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
  textareaClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import { createSupportRequest } from "@/lib/support/storage";

export default function SupportNewPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user, isReady } = useAuth();
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

    if (!content.trim()) {
      setError(t("support.errorContent"));
      return;
    }

    setIsSubmitting(true);
    try {
      const request = createSupportRequest(user, {
        content,
        locale,
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
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          {t("support.newDescAutoClassify")}
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("support.requestContent")}>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("support.requestContentPlaceholder")}
              rows={10}
              maxLength={2000}
              className={`${textareaClassName} min-h-[260px]`}
              required
              autoFocus
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
