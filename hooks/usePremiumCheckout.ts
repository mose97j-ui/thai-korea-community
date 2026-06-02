"use client";

import { useCallback } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthErrorKey } from "@/lib/auth/errors";
import { PREMIUM_ORDER_NAME } from "@/lib/payments/config";

type CheckoutSession = {
  mock: boolean;
  orderId?: string;
  amount: number;
  orderName?: string;
  clientKey?: string | null;
};

type CheckoutResult = { ok: true } | { ok: false; errorKey: AuthErrorKey };

export function usePremiumCheckout() {
  const { user, subscribePremium, activatePremiumAfterPayment } = useAuth();

  const startCheckout = useCallback(async (): Promise<CheckoutResult> => {
    if (!user) {
      return { ok: false, errorKey: "LOGIN_REQUIRED" };
    }

    const checkoutResponse = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        customerEmail: user.gmail,
        customerName: user.nickname || user.name,
        currentPremiumUntil: user.premiumUntil,
      }),
    });

    if (!checkoutResponse.ok) {
      return { ok: false, errorKey: "PAYMENT_FAILED" };
    }

    const session = (await checkoutResponse.json()) as CheckoutSession;

    if (session.mock) {
      const result = subscribePremium();
      if (!result.ok) {
        return { ok: false, errorKey: result.errorKey };
      }
      return { ok: true };
    }

    if (!session.clientKey || !session.orderId) {
      return { ok: false, errorKey: "PAYMENT_CONFIG_MISSING" };
    }

    const tossPayments = await loadTossPayments(session.clientKey);
    const payment = tossPayments.payment({ customerKey: user.id });

    await payment.requestPayment({
      method: "CARD",
      amount: {
        currency: "KRW",
        value: session.amount,
      },
      orderId: session.orderId,
      orderName: session.orderName ?? PREMIUM_ORDER_NAME,
      successUrl: `${window.location.origin}/premium/payment/success`,
      failUrl: `${window.location.origin}/premium/payment/fail`,
      customerEmail: user.gmail,
      customerName: user.nickname || user.name,
    });

    return { ok: true };
  }, [user, subscribePremium]);

  const confirmPayment = useCallback(
    async (input: {
      paymentKey?: string | null;
      orderId?: string | null;
      amount?: string | null;
      mock?: boolean;
    }): Promise<CheckoutResult> => {
      if (!user) {
        return { ok: false, errorKey: "LOGIN_REQUIRED" };
      }

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: input.paymentKey,
          orderId: input.orderId,
          amount: input.amount ? Number(input.amount) : undefined,
          userId: user.id,
          mock: input.mock,
        }),
      });

      if (!response.ok) {
        return { ok: false, errorKey: "PAYMENT_CONFIRM_FAILED" };
      }

      const data = (await response.json()) as {
        userId: string;
        premiumUntil: string;
      };

      if (data.userId !== user.id) {
        return { ok: false, errorKey: "PAYMENT_CONFIRM_FAILED" };
      }

      const result = activatePremiumAfterPayment(data.premiumUntil);
      if (!result.ok) {
        return { ok: false, errorKey: result.errorKey };
      }

      return { ok: true };
    },
    [user, activatePremiumAfterPayment]
  );

  return { startCheckout, confirmPayment };
}
