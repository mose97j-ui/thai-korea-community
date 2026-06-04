import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { listMemberRegistry, memberRowToUser } from "@/lib/supabase/memberRegistry";
import { listAllProfiles, profileRowToUser } from "@/lib/supabase/profiles";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import type { User } from "@/lib/auth/types";

function mergeMemberLists(registry: User[], profiles: User[]): User[] {
  const byGmail = new Map<string, User>();

  for (const member of [...registry, ...profiles]) {
    const gmail = member.gmail?.trim().toLowerCase();
    if (!gmail) {
      continue;
    }
    const existing = byGmail.get(gmail);
    if (!existing) {
      byGmail.set(gmail, member);
      continue;
    }
    byGmail.set(gmail, {
      ...existing,
      ...member,
      id: existing.id,
      personalCode: existing.personalCode || member.personalCode,
      createdAt: existing.createdAt || member.createdAt,
      password: "",
    });
  }

  return [...byGmail.values()].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      members: [],
      meta: {
        configured: false,
        syncConfigured: false,
        registryCount: 0,
        profileCount: 0,
      },
    });
  }

  try {
    const supabase = createAdminClient();
    const registryRows = await listMemberRegistry(supabase);
    const registryMembers = registryRows.map(memberRowToUser);

    const profileRows = await listAllProfiles(supabase);
    const profileMembers = profileRows.map(profileRowToUser);

    const members = mergeMemberLists(registryMembers, profileMembers);

    return NextResponse.json({
      members,
      meta: {
        configured: true,
        syncConfigured: true,
        registryCount: registryMembers.length,
        profileCount: profileMembers.length,
      },
    });
  } catch {
    return NextResponse.json({
      members: [],
      meta: {
        configured: true,
        syncConfigured: true,
        registryCount: 0,
        profileCount: 0,
      },
    });
  }
}
