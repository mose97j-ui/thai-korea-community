"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useOperatorView } from "@/hooks/useOperatorView";
import {
  formatPremiumUntil,
  getPremiumStatus,
  hasPremiumAccess,
} from "@/lib/auth/premium";

export function usePremiumAccess() {
  const { user, isReady } = useAuth();
  const { locale } = useLocale();
  const { viewAsUser } = useOperatorView();

  void viewAsUser;

  return {
    user,
    isReady,
    hasAccess: hasPremiumAccess(user),
    status: getPremiumStatus(user),
    premiumUntilLabel: formatPremiumUntil(user, locale),
  };
}
