"use client";

import { useState } from "react";
import { ErrorMessage, inputClassName, pillButtonClassName, secondaryButtonClassName } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import {
  sendVerificationCode,
  verifyCode,
  type VerificationMethod,
  type VerificationPurpose,
} from "@/lib/auth/verification";

type VerificationBlockProps = {
  target: string;
  method: VerificationMethod;
  purpose: VerificationPurpose;
  verified: boolean;
  onVerified: () => void;
  disabled?: boolean;
};

export default function VerificationBlock({
  target,
  method,
  purpose,
  verified,
  onVerified,
  disabled,
}: VerificationBlockProps) {
  const { t, te } = useLocale();
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setError("");
    const result = sendVerificationCode(target, method, purpose);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }
    setSent(true);
    setDevHint(result.devCode);
  };

  const handleVerify = () => {
    setError("");
    const result = verifyCode(target, code, purpose);
    if (!result.ok) {
      setError(te(result.errorKey));
      return;
    }
    onVerified();
  };

  if (verified) {
    return (
      <p className="rounded-xl bg-emerald-50 px-5 py-4 text-base text-emerald-700 ring-1 ring-emerald-100">
        {method === "email" ? t("verify.doneEmail") : t("verify.donePhone")}
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-[#F0F2F5] p-5 ring-1 ring-black/[0.06]">
      <p className="text-sm text-gray-500">{t("verify.expire")}</p>

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !target.trim()}
        className={`w-full ${secondaryButtonClassName} rounded-xl`}
      >
        {sent ? t("verify.resend") : t("verify.send")}
      </button>

      {devHint && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          {t("common.devCode")}: <strong>{devHint}</strong>
        </p>
      )}

      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder={t("verify.placeholder")}
        className={inputClassName}
      />

      <button
        type="button"
        onClick={handleVerify}
        disabled={code.length !== 6}
        className={`w-full ${pillButtonClassName} rounded-xl`}
      >
        {t("verify.confirm")}
      </button>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
