"use client";

import { useState } from "react";
import {
  ErrorMessage,
  pillButtonClassName,
  secondaryButtonClassName,
  inputClassName,
} from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import type { LinkImportDraft } from "@/lib/posts/linkExtract";
import { isValidImportUrl } from "@/lib/posts/linkExtract";
import { importPostFromLink } from "@/lib/posts/linkImportClient";

type PostLinkImportFieldProps = {
  defaultCategoryId: string;
  defaultSubId: string;
  onImported: (draft: LinkImportDraft) => void;
};

export default function PostLinkImportField({
  defaultCategoryId,
  defaultSubId,
  onImported,
}: PostLinkImportFieldProps) {
  const { t } = useLocale();
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    setError("");
    setSuccess("");

    if (!isValidImportUrl(linkUrl)) {
      setError(t("post.errorImportUrl"));
      return;
    }

    setIsImporting(true);
    try {
      const result = await importPostFromLink(linkUrl, {
        categoryId: defaultCategoryId,
        subId: defaultSubId,
      });

      if (!result.ok) {
        setError(t("post.errorImportFailed"));
        return;
      }

      onImported(result.draft);
      setSuccess(t("post.importSuccess"));
    } catch {
      setError(t("post.errorImportFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-[#06C755]/40 bg-[#06C755]/5 p-5">
      <div>
        <p className="text-base font-semibold text-gray-900">{t("post.importLink")}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {t("post.importLinkHint")}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder={t("post.importLinkPlaceholder")}
          className={`min-w-0 flex-1 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => {
            void handleImport();
          }}
          disabled={isImporting}
          className={`shrink-0 ${isImporting ? secondaryButtonClassName : pillButtonClassName}`}
        >
          {isImporting ? t("post.importing") : t("post.importApply")}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {success}
        </p>
      )}
    </div>
  );
}
