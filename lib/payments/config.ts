export const PREMIUM_AMOUNT = 9900;
export const PREMIUM_ORDER_NAME = "Thai Korea Community Premium";

export function getTossClientKey(): string {
  return process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY?.trim() ?? "";
}

export function getTossSecretKey(): string {
  return process.env.TOSS_PAYMENTS_SECRET_KEY?.trim() ?? "";
}

export function isPaymentConfigured(): boolean {
  return Boolean(getTossClientKey() && getTossSecretKey());
}

/** Mock checkout when keys are missing or PREMIUM_PAYMENT_MOCK=true */
export function isPaymentMockMode(): boolean {
  if (process.env.PREMIUM_PAYMENT_MOCK === "true") {
    return true;
  }
  if (process.env.PREMIUM_PAYMENT_MOCK === "false") {
    return false;
  }
  return !isPaymentConfigured();
}

export function getPublicPaymentConfig() {
  return {
    mock: isPaymentMockMode(),
    clientKey: isPaymentMockMode() ? null : getTossClientKey(),
    amount: PREMIUM_AMOUNT,
    orderName: PREMIUM_ORDER_NAME,
  };
}
