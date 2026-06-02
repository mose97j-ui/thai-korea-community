import { NextResponse } from "next/server";
import { isPaymentMockMode } from "@/lib/payments/config";
import {
  computePremiumUntilAfterPayment,
  getPaymentOrder,
  markPaymentOrderFailed,
  markPaymentOrderPaid,
} from "@/lib/payments/orderStore";
import { confirmTossPayment } from "@/lib/payments/toss";

type ConfirmBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  userId?: string;
  mock?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ConfirmBody;

  if (body.mock || isPaymentMockMode()) {
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    const premiumUntil = computePremiumUntilAfterPayment();
    return NextResponse.json({
      ok: true,
      userId,
      premiumUntil,
      mock: true,
    });
  }

  const paymentKey = body.paymentKey?.trim();
  const orderId = body.orderId?.trim();
  const amount = body.amount;

  if (!paymentKey || !orderId || typeof amount !== "number") {
    return NextResponse.json({ error: "INVALID_PAYMENT_PARAMS" }, { status: 400 });
  }

  const order = getPaymentOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  if (order.status === "paid" && order.premiumUntil) {
    return NextResponse.json({
      ok: true,
      userId: order.userId,
      premiumUntil: order.premiumUntil,
      alreadyPaid: true,
    });
  }

  if (order.amount !== amount) {
    markPaymentOrderFailed(orderId, "AMOUNT_MISMATCH");
    return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
  }

  try {
    await confirmTossPayment({ paymentKey, orderId, amount });
    const premiumUntil = computePremiumUntilAfterPayment(
      order.currentPremiumUntil
    );
    markPaymentOrderPaid(orderId, paymentKey, premiumUntil);

    return NextResponse.json({
      ok: true,
      userId: order.userId,
      premiumUntil,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PAYMENT_CONFIRM_FAILED";
    markPaymentOrderFailed(orderId, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
