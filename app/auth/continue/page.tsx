"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import { Card } from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/contexts/AuthContext";
import { refreshSupabaseSession } from "@/lib/auth/supabaseUser";

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
      const result = await refreshSupabaseSession();
      await refreshSession();

      if (!active) {
        return;
      }

      if (!result.user) {
        router.replace("/login?error=auth");
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
    <PageShell maxWidth="2xl">
      <Card className="py-12 text-center text-lg text-gray-600">{message}</Card>
    </PageShell>
  );
}

function AuthContinueFallback() {
  const { t } = useLocale();

  return (
    <PageShell maxWidth="2xl">
      <Card className="py-12 text-center text-lg text-gray-600">{t("auth.continuing")}</Card>
    </PageShell>
  );
}

export default function AuthContinuePage() {
  return (
    <Suspense fallback={<AuthContinueFallback />}>
      <AuthContinueContent />
    </Suspense>
  );
}
