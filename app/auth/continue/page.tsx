"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { refreshSupabaseSessionWithRetry } from "@/lib/auth/refreshSessionWithRetry";

function AuthContinueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { refreshSession } = useAuth();
  const [message, setMessage] = useState(t("auth.continuing"));

  useEffect(() => {
    let active = true;

    async function run() {
      const next = searchParams.get("next") || "/";
      router.refresh();
      const result = await refreshSupabaseSessionWithRetry();
      await refreshSession();

      if (!active) {
        return;
      }

      if (!result.user) {
        router.replace("/login?error=auth&reason=session_missing");
        return;
      }

      if (!result.profileComplete) {
        router.replace(`/signup/complete?next=${encodeURIComponent(next)}`);
        return;
      }

      router.replace(next.startsWith("/") ? next : "/");
    }

    run().catch(() => {
      if (active) {
        setMessage(t("auth.googleFailed"));
      }
    });

    return () => {
      active = false;
    };
  }, [router, searchParams, t, refreshSession]);

  return (
    <AuthPageShell centerContent>
      <Card className="py-12 text-center text-lg text-gray-600">{message}</Card>
    </AuthPageShell>
  );
}

function AuthContinueFallback() {
  const { t } = useLocale();

  return (
    <AuthPageShell centerContent>
      <Card className="py-12 text-center text-lg text-gray-600">{t("auth.continuing")}</Card>
    </AuthPageShell>
  );
}

export default function AuthContinuePage() {
  return (
    <Suspense fallback={<AuthContinueFallback />}>
      <AuthContinueContent />
    </Suspense>
  );
}
