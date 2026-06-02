import { NextResponse } from "next/server";
import {
  PREMIUM_AMOUNT,
  PREMIUM_ORDER_NAME,
  getPublicPaymentConfig,
} from "@/lib/payments/config";
import { createPaymentOrder } from "@/lib/payments/orderStore";

type CheckoutBody = {
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  currentPremiumUntil?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutBody;
  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
  }

  const config = getPublicPaymentConfig();

  if (config.mock) {
    return NextResponse.json({
      mock: true,
      amount: PREMIUM_AMOUNT,
      orderName: PREMIUM_ORDER_NAME,
    });
  }

  const order = createPaymentOrder({
    userId,
    amount: PREMIUM_AMOUNT,
    currentPremiumUntil: body.currentPremiumUntil,
  });

  return NextResponse.json({
    mock: false,
    orderId: order.orderId,
    amount: order.amount,
    orderName: PREMIUM_ORDER_NAME,
    clientKey: config.clientKey,
    customerEmail: body.customerEmail,
    customerName: body.customerName,
  });
}
