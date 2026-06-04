import { NextResponse } from "next/server";
import {
  upsertMemberRegistry,
  upsertMemberRegistryProfile,
} from "@/lib/supabase/memberRegistry";
import type { User } from "@/lib/auth/types";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

type SyncMemberBody = {
  id?: string;
  name?: string;
  nickname?: string;
  gender?: User["gender"];
  profileImage?: string;
  birthDate?: string;
  hometown?: string;
  gmail?: string;
  koreanPhone?: string;
  personalCode?: string;
  referredBy?: string;
  role?: User["role"];
  premiumUntil?: string;
  restriction?: User["restriction"];
  authProvider?: User["authProvider"];
  createdAt?: string;
  syncAsOperator?: boolean;
  /** Required when syncAsOperator — proves the request is from the operator session. */
  operatorGmail?: string;
};

function getOperatorGmail(): string {
  return (process.env.NEXT_PUBLIC_OPERATOR_GMAIL || "mose97j@gmail.com").toLowerCase();
}

function isOperatorSyncRequest(body: SyncMemberBody): boolean {
  const operatorGmail = body.operatorGmail?.trim().toLowerCase();
  return body.syncAsOperator === true && operatorGmail === getOperatorGmail();
}

function parseSyncBody(body: SyncMemberBody, operatorSync: boolean): User | null {
  const gmail = body.gmail?.trim().toLowerCase();
  const id = body.id?.trim();
  const nickname = body.nickname?.trim();
  const name = body.name?.trim();

  if (!id || !gmail || !nickname || !name || !body.personalCode?.trim()) {
    return null;
  }

  if (!gmail.endsWith("@gmail.com")) {
    return null;
  }

  return {
    id,
    name,
    nickname,
    gender: body.gender,
    profileImage: body.profileImage?.trim() || undefined,
    birthDate: body.birthDate?.trim() || "",
    hometown: body.hometown?.trim() || "",
    gmail,
    koreanPhone: body.koreanPhone?.trim() || "",
    personalCode: body.personalCode.trim().toUpperCase(),
    referredBy: body.referredBy?.trim().toUpperCase() || undefined,
    password: "",
    role: operatorSync && body.role === "operator" ? "operator" : "user",
    premiumUntil: operatorSync ? body.premiumUntil : undefined,
    restriction: operatorSync ? body.restriction : undefined,
    authProvider: body.authProvider ?? "local",
    createdAt: body.createdAt || new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Member sync is not configured on the server." },
      { status: 503 }
    );
  }

  let body: SyncMemberBody;
  try {
    body = (await request.json()) as SyncMemberBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const operatorSync = isOperatorSyncRequest(body);
  const user = parseSyncBody(body, operatorSync);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid member payload." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const result = operatorSync
      ? await upsertMemberRegistry(supabase, user)
      : await upsertMemberRegistryProfile(supabase, user);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
