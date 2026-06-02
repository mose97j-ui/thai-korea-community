"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ErrorMessage,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { usePremiumCheckout } from "@/hooks/usePremiumCheckout";
import { PREMIUM_PLAN_DAYS } from "@/lib/auth/premium";
import { getCategoryOverviewHref, homeCategoryItems } from "@/lib/i18n/content";

type PremiumPaywallProps = {
  variant?: "page" | "inline";
  backHref?: string;
};

export default function PremiumPaywall({
  variant = "page",
  backHref = "/",
}: PremiumPaywallProps) {
  const router = useRouter();
  const { t, pick, te } = useLocale();
  const { user } = useAuth();
  const { hasAccess, premiumUntilLabel } = usePremiumAccess();
  const { startCheckout } = usePremiumCheckout();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMock, setPaymentMock] = useState(true);

  const benefits = homeCategoryItems.premium ?? [];

  useEffect(() => {
    void fetch("/api/payments/config")
      .then((response) => response.json())
      .then((data: { mock?: boolean }) => setPaymentMock(Boolean(data.mock)))
      .catch(() => setPaymentMock(true));
  }, []);

  const handleSubscribe = async () => {
    setError("");

    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/premium")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await startCheckout();
      if (!result.ok) {
        setError(te(result.errorKey));
        return;
      }

      if (paymentMock) {
        router.push(getCategoryOverviewHref("premium"));
      }
    } catch {
      setError(te("PAYMENT_FAILED"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const shellClass =
    variant === "page"
      ? "overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 text-white shadow-xl ring-1 ring-amber-500/20"
      : "overflow-hidden rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950 text-white ring-1 ring-amber-500/20";

  return (
    <div className={shellClass}>
      <div className="border-b border-white/10 px-6 py-8 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-4xl ring-1 ring-amber-300/30">
            👑
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Premium
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
              {t("premium.title")}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">
              {t("premium.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        {hasAccess && premiumUntilLabel ? (
          <div className="rounded-2xl bg-emerald-500/10 px-5 py-4 ring-1 ring-emerald-400/20">
            <p className="text-base font-semibold text-emerald-200">
              {t("premium.active")}
            </p>
            <p className="mt-1 text-sm text-emerald-100/80">
              {t("premium.until").replace("{date}", premiumUntilLabel)}
            </p>
            <Link
              href={getCategoryOverviewHref("premium")}
              className={`mt-4 inline-flex ${secondaryButtonClassName} bg-white/10 text-white ring-white/10 hover:bg-white/15`}
            >
              {t("premium.enter")}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(18rem,32%)]">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-200/80">
                  {t("premium.benefitsTitle")}
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {benefits.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span>
                        <span className="block text-base font-semibold text-white">
                          {pick(item.title)}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-white/60">
                          {pick(item.description)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 lg:sticky lg:top-[var(--social-sticky-top)] lg:self-start">
                <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-amber-400/25">
                  <p className="text-sm text-white/60">{t("premium.planLabel")}</p>
                  <p className="mt-2 text-3xl font-bold text-amber-300">
                    {t("premium.price")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {t("premium.planNote").replace(
                      "{days}",
                      String(PREMIUM_PLAN_DAYS)
                    )}
                  </p>
                </div>

                {error && (
                  <div className="[&_p]:bg-red-500/10 [&_p]:text-red-200 [&_p]:ring-red-400/20">
                    <ErrorMessage message={error} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    void handleSubscribe();
                  }}
                  disabled={isSubmitting}
                  className={`w-full bg-amber-400 text-gray-950 hover:bg-amber-300 ${primaryButtonClassName}`}
                >
                  {isSubmitting
                    ? t("premium.processing")
                    : user
                      ? paymentMock
                        ? t("premium.subscribe")
                        : t("premium.payWithToss")
                      : t("premium.loginToSubscribe")}
                </button>

                <p className="text-center text-xs leading-relaxed text-white/45">
                  {paymentMock ? t("premium.mockNote") : t("premium.tossNote")}
                </p>
              </div>
            </div>
          </>
        )}

        {variant === "inline" && !hasAccess && (
          <Link
            href="/premium"
            className={`flex w-full items-center justify-center ${secondaryButtonClassName} bg-white/10 text-white ring-white/10 hover:bg-white/15`}
          >
            {t("premium.viewPlans")}
          </Link>
        )}

        {variant === "page" && (
          <Link
            href={backHref}
            className="block text-center text-sm text-white/50 hover:text-white/80"
          >
            {t("common.backHome")}
          </Link>
        )}
      </div>
    </div>
  );
}
