import type { User } from "@/lib/auth/types";
import { getAllSupportRequests } from "@/lib/support/storage";
import type { SupportRequest } from "@/lib/support/types";
import { emitSocialChange } from "./events";
import {
  fetchDirectMessagesForUser,
  fetchDirectMessagesFromSupabase,
  readAllLocalMessages,
} from "./messageSync";
import { resolveMessagePartyGmail } from "./resolveMessageGmail";
import type { DirectMessage } from "./types";
import { fetchSupportRequestsForUser } from "@/lib/support/supportSync";
import { SUPPORT_CHANGE_EVENT } from "@/lib/support/types";

export type SocialBackfillResult = {
  messagesPulled: number;
  messagesPushed: number;
  supportPulled: number;
  supportPushed: number;
};

const MESSAGE_BATCH = 80;
const SUPPORT_BATCH = 50;

function buildMessageBackfillItems(
  messages: DirectMessage[]
): Array<{ message: DirectMessage; senderGmail: string; recipientGmail: string }> {
  const items: Array<{
    message: DirectMessage;
    senderGmail: string;
    recipientGmail: string;
  }> = [];

  for (const message of messages) {
    const senderGmail = resolveMessagePartyGmail(message, message.senderId);
    const recipientGmail = resolveMessagePartyGmail(message, message.recipientId);
    if (!senderGmail || !recipientGmail) {
      continue;
    }
    items.push({ message, senderGmail, recipientGmail });
  }

  return items;
}

async function backfillLocalMessagesToServer(
  messages: DirectMessage[]
): Promise<number> {
  const items = buildMessageBackfillItems(messages);
  if (items.length === 0) {
    return 0;
  }

  let synced = 0;

  for (let offset = 0; offset < items.length; offset += MESSAGE_BATCH) {
    const chunk = items.slice(offset, offset + MESSAGE_BATCH);
    try {
      const response = await fetch("/api/messages/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk }),
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as { synced?: number };
        synced += payload.synced ?? 0;
      }
    } catch {
      // Continue with next chunk.
    }
  }

  return synced;
}

async function backfillLocalSupportToServer(
  requests: SupportRequest[]
): Promise<number> {
  const syncable = requests.filter((item) => {
    const gmail = item.userGmail?.trim().toLowerCase() ?? "";
    return gmail.endsWith("@gmail.com");
  });

  if (syncable.length === 0) {
    return 0;
  }

  let synced = 0;

  for (let offset = 0; offset < syncable.length; offset += SUPPORT_BATCH) {
    const chunk = syncable.slice(offset, offset + SUPPORT_BATCH);
    try {
      const response = await fetch("/api/support/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: chunk }),
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as { synced?: number };
        synced += payload.synced ?? 0;
      }
    } catch {
      // Continue with next chunk.
    }
  }

  return synced;
}

async function pullAllMessagesForUser(user: User): Promise<number> {
  const fromApi = await fetchDirectMessagesForUser(user);
  const fromClient = await fetchDirectMessagesFromSupabase(user);
  return Math.max(fromApi, fromClient);
}

async function pullAllSupportForUser(user: User): Promise<number> {
  return fetchSupportRequestsForUser(user);
}

/**
 * Login backfill: pull full server history, upload local-only past data, pull again.
 */
export async function backfillSocialDataForUser(
  user: User
): Promise<SocialBackfillResult> {
  const messagesPulled1 = await pullAllMessagesForUser(user);
  const supportPulled1 = await pullAllSupportForUser(user);

  const localMessages = readAllLocalMessages();
  const localSupport = getAllSupportRequests();

  const messagesPushed = await backfillLocalMessagesToServer(localMessages);
  const supportPushed = await backfillLocalSupportToServer(localSupport);

  const messagesPulled2 = await pullAllMessagesForUser(user);
  const supportPulled2 = await pullAllSupportForUser(user);

  if (
    messagesPushed > 0 ||
    supportPushed > 0 ||
    messagesPulled1 > 0 ||
    messagesPulled2 > 0
  ) {
    emitSocialChange();
  }

  if (
    typeof window !== "undefined" &&
    (supportPulled1 > 0 || supportPulled2 > 0 || supportPushed > 0)
  ) {
    window.dispatchEvent(new Event(SUPPORT_CHANGE_EVENT));
  }

  return {
    messagesPulled: Math.max(messagesPulled1, messagesPulled2),
    messagesPushed,
    supportPulled: Math.max(supportPulled1, supportPulled2),
    supportPushed,
  };
}
