import { getTossSecretKey } from "./config";

type TossConfirmResponse = {
  status?: string;
  orderId?: string;
  totalAmount?: number;
  method?: string;
  message?: string;
};

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResponse> {
  const secretKey = getTossSecretKey();
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY_MISSING");
  }

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
      cache: "no-store",
    }
  );

  const data = (await response.json()) as TossConfirmResponse & {
    code?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || data.code || "TOSS_CONFIRM_FAILED");
  }

  return data;
}
