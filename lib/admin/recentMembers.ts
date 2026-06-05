import { getAllUsers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";

function mergeMemberDirectory(server: User[], local: User[]): User[] {
  const byGmail = new Map<string, User>();

  for (const member of [...server, ...local]) {
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

/** Recent signups for operator dashboards (server + this browser, newest first). */
export function listRecentMembersForOperator(
  limit = 20,
  serverMembers: User[] = []
): User[] {
  const local = getAllUsers();
  return mergeMemberDirectory(serverMembers, local).slice(0, limit);
}
