import type { SupportCategory } from "./types";

type CategoryRule = {
  category: SupportCategory;
  keywords: string[];
  weight?: number;
};

const RULES: CategoryRule[] = [
  {
    category: "board",
    weight: 1.2,
    keywords: [
      "게시판",
      "게시판추가",
      "게시판 추가",
      "board",
      "category",
      "menu",
      "메뉴",
      "카테고리",
      "그룹",
      "하위",
      "서브",
      "sub board",
      "กระดาน",
      "หมวด",
      "เมนู",
      "บอร์ด",
    ],
  },
  {
    category: "feature",
    weight: 1.15,
    keywords: [
      "기능",
      "추가해",
      "추가 요청",
      "개선",
      "제안",
      "feature",
      "function",
      "ui",
      "ux",
      "디자인",
      "버튼",
      "알림",
      "notification",
      "premium",
      "프리미엄",
      "ฟีเจอร์",
      "ฟังก์ชัน",
      "แนะนำ",
      "ปรับปรุง",
    ],
  },
  {
    category: "qa",
    weight: 1.1,
    keywords: [
      "질문",
      "문의",
      "궁금",
      "어떻게",
      "사용법",
      "방법",
      "오류",
      "에러",
      "error",
      "bug",
      "버그",
      "안돼",
      "안돼요",
      "안됨",
      "로그인",
      "가입",
      "password",
      "비밀번호",
      "help",
      "how to",
      "ถาม",
      "สอบถาม",
      "ปัญหา",
      "ใช้งาน",
      "error",
    ],
  },
];

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/** Classify member inquiry text into an operator-only request type. */
export function classifySupportCategory(content: string): SupportCategory {
  const normalized = normalizeForMatch(content.trim());
  if (!normalized) {
    return "other";
  }

  const scores: Record<SupportCategory, number> = {
    board: 0,
    feature: 0,
    qa: 0,
    other: 0,
  };

  for (const rule of RULES) {
    const weight = rule.weight ?? 1;
    for (const keyword of rule.keywords) {
      const key = normalizeForMatch(keyword);
      if (key.length < 2) {
        continue;
      }
      if (normalized.includes(key)) {
        scores[rule.category] += weight * Math.min(3, Math.ceil(key.length / 4));
      }
    }
  }

  let best: SupportCategory = "other";
  let bestScore = 0;

  for (const category of ["board", "feature", "qa"] as const) {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      best = category;
    }
  }

  if (bestScore < 1) {
    return "other";
  }

  return best;
}
