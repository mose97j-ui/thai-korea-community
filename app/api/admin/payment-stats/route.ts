import { NextResponse } from "next/server";
import { getPaymentSummary } from "@/lib/payments/orderStore";

export async function GET() {
  return NextResponse.json(getPaymentSummary());
}
