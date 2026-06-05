import { getInternationalAge, getUserBirthDate } from "@/lib/auth/age";
import { isOperatorUser } from "@/lib/auth/operator";
import {
  getPremiumStatus,
  hasPremiumAccess,
} from "@/lib/auth/premium";
import { getAllUsers } from "@/lib/auth/storage";
import type { User } from "@/lib/auth/types";
import { getAllPosts } from "@/lib/posts/storage";
import { getCommentCountsByPostIds } from "@/lib/social/comments";
import { getLikesByPostIds } from "@/lib/social/likes";

export type StatRow = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type OperatorAnalytics = {
  summary: {
    totalMembers: number;
    totalOperators: number;
    premiumActive: number;
    premiumExpired: number;
    freeMembers: number;
    withReferral: number;
    withProfilePhoto: number;
    recentSignups7d: number;
    maleCount: number;
    femaleCount: number;
  };
  gender: StatRow[];
  ageGroups: StatRow[];
  hometowns: StatRow[];
  membership: StatRow[];
  signupsByMonth: StatRow[];
  postsByCategory: StatRow[];
  community: {
    posts: number;
    comments: number;
    likes: number;
    messages: number;
  };
  payments: {
    paidCount: number;
    revenue: number;
    failedCount: number;
    pendingCount: number;
  } | null;
};

function toRows(map: Map<string, number>, labels: Record<string, string>): StatRow[] {
  const total = [...map.values()].reduce((sum, count) => sum + count, 0);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

function getAgeGroupKey(age: number): string {
  if (age < 25) return "18-24";
  if (age < 30) return "25-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  return "50+";
}

function getMonthKey(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function countMessages(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem("tkc_messages");
    return raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {
    return 0;
  }
}

function countLikes(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem("tkc_likes");
    return raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {
    return 0;
  }
}

function countComments(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem("tkc_comments");
    return raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {
    return 0;
  }
}

function filterMembers(users: User[]): User[] {
  return users.filter((user) => !isOperatorUser(user));
}

export function buildOperatorAnalytics(
  labels: {
    gender: Record<string, string>;
    age: Record<string, string>;
    membership: Record<string, string>;
    monthUnknown: string;
    hometownUnknown: string;
    categoryLabels: Record<string, string>;
  },
  payments: OperatorAnalytics["payments"] = null
): OperatorAnalytics {
  const allUsers = getAllUsers();
  const members = filterMembers(allUsers);
  const operators = allUsers.filter((user) => isOperatorUser(user));
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  let premiumActive = 0;
  let premiumExpired = 0;
  let freeMembers = 0;
  let withReferral = 0;
  let withProfilePhoto = 0;
  let recentSignups7d = 0;
  let maleCount = 0;
  let femaleCount = 0;

  const genderMap = new Map<string, number>();
  const ageMap = new Map<string, number>();
  const hometownMap = new Map<string, number>();
  const membershipMap = new Map<string, number>();
  const monthMap = new Map<string, number>();

  for (const member of members) {
    if (hasPremiumAccess(member)) {
      premiumActive += 1;
    } else if (getPremiumStatus(member) === "expired") {
      premiumExpired += 1;
    } else {
      freeMembers += 1;
    }

    if (member.referredBy) {
      withReferral += 1;
    }
    if (member.profileImage) {
      withProfilePhoto += 1;
    }
    if (new Date(member.createdAt).getTime() >= sevenDaysAgo) {
      recentSignups7d += 1;
    }

    const genderKey = member.gender ?? "unknown";
    genderMap.set(genderKey, (genderMap.get(genderKey) ?? 0) + 1);
    if (member.gender === "male") maleCount += 1;
    if (member.gender === "female") femaleCount += 1;

    const age = getInternationalAge(getUserBirthDate(member));
    const ageKey = getAgeGroupKey(age);
    ageMap.set(ageKey, (ageMap.get(ageKey) ?? 0) + 1);

    const hometown = member.hometown?.trim() || labels.hometownUnknown;
    hometownMap.set(hometown, (hometownMap.get(hometown) ?? 0) + 1);

    const membershipKey = hasPremiumAccess(member)
      ? "premiumActive"
      : getPremiumStatus(member) === "expired"
        ? "premiumExpired"
        : "free";
    membershipMap.set(membershipKey, (membershipMap.get(membershipKey) ?? 0) + 1);

    const monthKey = getMonthKey(member.createdAt);
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1);
  }

  const posts = getAllPosts();
  const postIds = posts.map((post) => post.id);
  const categoryMap = new Map<string, number>();
  for (const post of posts) {
    categoryMap.set(post.categoryId, (categoryMap.get(post.categoryId) ?? 0) + 1);
  }

  const likesFromPosts = [...getLikesByPostIds(postIds).values()].reduce(
    (sum, count) => sum + count,
    0
  );
  const commentsFromPosts = [...getCommentCountsByPostIds(postIds).values()].reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    summary: {
      totalMembers: allUsers.length,
      totalOperators: operators.length,
      premiumActive,
      premiumExpired,
      freeMembers,
      withReferral,
      withProfilePhoto,
      recentSignups7d,
      maleCount,
      femaleCount,
    },
    gender: toRows(genderMap, labels.gender),
    ageGroups: toRows(ageMap, labels.age),
    hometowns: [...hometownMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key, count]) => ({
        key,
        label: key,
        count,
        percent:
          members.length > 0 ? Math.round((count / members.length) * 100) : 0,
      })),
    membership: toRows(membershipMap, labels.membership),
    signupsByMonth: toRows(monthMap, { unknown: labels.monthUnknown }).slice(0, 8),
    postsByCategory: toRows(categoryMap, labels.categoryLabels),
    community: {
      posts: posts.length,
      comments: commentsFromPosts || countComments(),
      likes: likesFromPosts || countLikes(),
      messages: countMessages(),
    },
    payments,
  };
}
