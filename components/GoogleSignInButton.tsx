"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { getGoogleRedirectUrl } from "@/lib/auth/supabaseUser";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client";
import { primaryButtonClassName } from "@/components/ui";

type GoogleSignInButtonProps = {
  nextPath?: string;
  labelKey?: "auth.googleLogin" | "auth.googleSignup";
};

export default function GoogleSignInButton({
  nextPath = "/",
  labelKey = "auth.googleLogin",
}: GoogleSignInButtonProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured()) {
        setError(t("auth.googleFailed"));
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getGoogleRedirectUrl(nextPath),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("auth.googleFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-3 ${primaryButtonClassName}`}
      >
        <span className="text-lg">G</span>
        <span>{loading ? t("auth.googleLoading") : t(labelKey)}</span>
      </button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
