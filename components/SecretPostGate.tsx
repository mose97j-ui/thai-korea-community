"use client";

import { useState } from "react";
import {
  ErrorMessage,
  FormField,
  SubmitButton,
  inputClassName,
} from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

type SecretPostGateProps = {
  onUnlock: (password: string) => Promise<boolean>;
  compact?: boolean;
};

export default function SecretPostGate({
  onUnlock,
  compact = false,
}: SecretPostGateProps) {
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!password.trim()) {
      setError(t("post.errorSecretPassword"));
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onUnlock(password);
      if (!ok) {
        setError(t("post.secretWrongPassword"));
        setPassword("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-amber-100 bg-amber-50/80 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          🔒
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-gray-900">
            {t("post.secretLockedTitle")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {t("post.secretLockedDesc")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <FormField label={t("post.secretPassword")}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("post.secretPasswordPlaceholder")}
            maxLength={20}
            autoComplete="off"
            className={inputClassName}
          />
        </FormField>

        {error && <ErrorMessage message={error} />}

        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : t("post.secretUnlock")}
        </SubmitButton>
      </form>
    </div>
  );
}
