import type { User } from "./types";
import { getOperatorDefaults } from "./operator";
import { normalizePhone } from "./phone";

const USERS_KEY = "tkc_users";
const SESSION_KEY = "tkc_session";

let memberSyncHandler: ((user: User) => void) | null = null;

/** Register server sync callback (AuthContext sets this on mount). */
export function setMemberSyncHandler(handler: ((user: User) => void) | null): void {
  memberSyncHandler = handler;
}

function notifyMemberSync(user: User): void {
  memberSyncHandler?.(user);
}

export function generatePersonalCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TK${suffix}`;
}

export function getAllUsers(): User[] {
  return readUsers();
}

function readUsers(): User[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? (JSON.parse(raw) as User[]) : [];
    return users.map((user) => ({
      ...user,
      nickname: user.nickname?.trim() || user.name,
    }));
  } catch {
    return [];
  }
}

function writeUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByGmail(gmail: string): User | undefined {
  return readUsers().find(
    (user) => user.gmail.toLowerCase() === gmail.toLowerCase()
  );
}

export function findUserById(id: string): User | undefined {
  return readUsers().find((user) => user.id === id);
}

export function findUserByPersonalCode(code: string): User | undefined {
  return readUsers().find(
    (user) => user.personalCode.toUpperCase() === code.toUpperCase()
  );
}

export function findUserByPhone(phone: string): User | undefined {
  const normalized = normalizePhone(phone);
  return readUsers().find(
    (user) => normalizePhone(user.koreanPhone) === normalized
  );
}

export function findUserByNickname(nickname: string): User | undefined {
  const normalized = nickname.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return readUsers().find(
    (user) => user.nickname?.trim().toLowerCase() === normalized
  );
}

export function findUserByNameAndPhone(
  name: string,
  phone: string
): User | undefined {
  const normalized = normalizePhone(phone);
  return readUsers().find(
    (user) =>
      user.name.trim() === name.trim() &&
      normalizePhone(user.koreanPhone) === normalized
  );
}

export function saveUser(user: User): void {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  notifyMemberSync(user);
}

/** Merge server-side member directory into local storage (keeps local passwords). */
export function mergeRemoteMembers(remote: User[]): void {
  if (remote.length === 0) {
    return;
  }

  const merged = new Map(readUsers().map((user) => [user.id, user]));

  for (const remoteUser of remote) {
    const existing =
      merged.get(remoteUser.id) ??
      [...merged.values()].find(
        (user) => user.gmail.toLowerCase() === remoteUser.gmail.toLowerCase()
      );

    if (existing) {
      merged.set(existing.id, {
        ...existing,
        ...remoteUser,
        id: existing.id,
        password: existing.password,
        authProvider: remoteUser.authProvider ?? existing.authProvider,
      });
      continue;
    }

    merged.set(remoteUser.id, {
      ...remoteUser,
      password: "",
    });
  }

  writeUsers([...merged.values()]);
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(userId: string): void {
  localStorage.setItem(SESSION_KEY, userId);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser(): User | null {
  const userId = getSessionUserId();
  if (!userId) {
    return null;
  }
  return readUsers().find((user) => user.id === userId) ?? null;
}

export function updateUser(updated: User): void {
  const users = readUsers().map((user) =>
    user.id === updated.id ? updated : user
  );
  writeUsers(users);
  notifyMemberSync(updated);
}

export function ensureOperatorAccount(): User {
  const defaults = getOperatorDefaults();
  const byGmail = findUserByGmail(defaults.gmail);
  const byId = readUsers().find((user) => user.id === defaults.id);
  const byCode = findUserByPersonalCode(defaults.personalCode);
  const base = byGmail ?? byId ?? byCode;

  if (base) {
    const updated: User = {
      ...base,
      ...defaults,
      id: base.id,
      role: "operator",
      gmail: defaults.gmail,
      password: defaults.password,
      personalCode: defaults.personalCode.toUpperCase(),
      nickname: base.nickname?.trim() || defaults.nickname,
      profileImage: base.profileImage ?? defaults.profileImage,
      referredBy: base.referredBy,
      premiumUntil: base.premiumUntil,
      restriction: base.restriction,
      createdAt: base.createdAt,
    };
    updateUser(updated);
    return updated;
  }

  const operator: User = {
    ...defaults,
    createdAt: new Date().toISOString(),
  };
  saveUser(operator);
  return operator;
}
