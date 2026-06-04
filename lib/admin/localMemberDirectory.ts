import { listLocalMembersForBackfill } from "@/lib/auth/memberBackfill";
import type { User } from "@/lib/auth/types";

/** Signups stored in this browser that are not yet in the server directory. */
export function countLocalMembersNotOnServer(serverMembers: User[]): number {
  const onServer = new Set(
    serverMembers
      .map((member) => member.gmail?.trim().toLowerCase())
      .filter((gmail): gmail is string => Boolean(gmail))
  );

  return listLocalMembersForBackfill().filter((member) => {
    const gmail = member.gmail?.trim().toLowerCase();
    return gmail && !onServer.has(gmail);
  }).length;
}
