import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PurchaseAgencyExportRow = {
  createdAt: string;
  categoryId: string;
  subId: string;
  title: string;
  content: string;
  authorNickname: string;
  bankAccount: string;
  phoneNumber: string;
  receiverAddress: string;
  inferredItems: string;
};

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toCsv(rows: PurchaseAgencyExportRow[]): string {
  const headers = [
    "createdAt",
    "categoryId",
    "subId",
    "title",
    "content",
    "authorNickname",
    "bankAccount",
    "phoneNumber",
    "receiverAddress",
    "inferredItems",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.createdAt,
        row.categoryId,
        row.subId,
        row.title,
        row.content,
        row.authorNickname,
        row.bankAccount,
        row.phoneNumber,
        row.receiverAddress,
        row.inferredItems,
      ]
        .map((value) => csvEscape(value))
        .join(",")
    );
  }
  return lines.join("\n");
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .not("purchase_agency", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows: PurchaseAgencyExportRow[] = (data ?? []).map((row: any) => {
    const purchase = row.purchase_agency ?? {};
    return {
      createdAt: String(row.created_at ?? ""),
      categoryId: String(row.category_id ?? ""),
      subId: String(row.sub_id ?? ""),
      title: String(row.title ?? row.store_name ?? ""),
      content: String(row.content ?? ""),
      authorNickname: String(row.author_nickname ?? ""),
      bankAccount: String(purchase.bankAccount ?? ""),
      phoneNumber: String(purchase.phoneNumber ?? ""),
      receiverAddress: String(purchase.receiverAddress ?? ""),
      inferredItems: Array.isArray(purchase.inferredItems)
        ? purchase.inferredItems.join(", ")
        : String(purchase.inferredItems ?? ""),
    };
  });

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="purchase-agency-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
