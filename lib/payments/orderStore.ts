import fs from "fs";
import path from "path";
import { PREMIUM_PLAN_DAYS } from "@/lib/auth/premium";

export type PaymentOrderStatus = "pending" | "paid" | "failed";

export type PaymentOrder = {
  orderId: string;
  userId: string;
  amount: number;
  currentPremiumUntil?: string;
  status: PaymentOrderStatus;
  paymentKey?: string;
  premiumUntil?: string;
  createdAt: string;
  paidAt?: string;
  failReason?: string;
};

const ORDERS_PATH = path.join(process.cwd(), "data", "payment-orders.json");

function ensureDataDir(): void {
  const dir = path.dirname(ORDERS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readOrders(): PaymentOrder[] {
  try {
    if (!fs.existsSync(ORDERS_PATH)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8")) as PaymentOrder[];
  } catch {
    return [];
  }
}

function writeOrders(orders: PaymentOrder[]): void {
  ensureDataDir();
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

export function createOrderId(): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `tkc-${Date.now()}-${suffix}`;
}

export function computePremiumUntilAfterPayment(
  currentPremiumUntil?: string
): string {
  const now = new Date();
  const currentEnd = currentPremiumUntil
    ? new Date(currentPremiumUntil)
    : null;
  const base =
    currentEnd && !Number.isNaN(currentEnd.getTime()) && currentEnd > now
      ? currentEnd
      : now;
  const next = new Date(base);
  next.setDate(next.getDate() + PREMIUM_PLAN_DAYS);
  return next.toISOString();
}

export function createPaymentOrder(input: {
  userId: string;
  amount: number;
  currentPremiumUntil?: string;
}): PaymentOrder {
  const order: PaymentOrder = {
    orderId: createOrderId(),
    userId: input.userId,
    amount: input.amount,
    currentPremiumUntil: input.currentPremiumUntil,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);
  return order;
}

export function getPaymentOrder(orderId: string): PaymentOrder | undefined {
  return readOrders().find((order) => order.orderId === orderId);
}

export function markPaymentOrderPaid(
  orderId: string,
  paymentKey: string,
  premiumUntil: string
): PaymentOrder | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.orderId === orderId);
  if (index === -1) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    status: "paid",
    paymentKey,
    premiumUntil,
    paidAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return orders[index];
}

export function markPaymentOrderFailed(
  orderId: string,
  failReason: string
): void {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.orderId === orderId);
  if (index === -1) {
    return;
  }

  orders[index] = {
    ...orders[index],
    status: "failed",
    failReason,
  };
  writeOrders(orders);
}

export function getPaymentSummary() {
  const orders = readOrders();
  const paid = orders.filter((order) => order.status === "paid");
  const failed = orders.filter((order) => order.status === "failed");
  const pending = orders.filter((order) => order.status === "pending");

  return {
    paidCount: paid.length,
    revenue: paid.reduce((sum, order) => sum + order.amount, 0),
    failedCount: failed.length,
    pendingCount: pending.length,
  };
}
