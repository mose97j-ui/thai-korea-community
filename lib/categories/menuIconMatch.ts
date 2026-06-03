import { DEFAULT_MENU_TINT, MENU_TINT_PRESETS } from "./tintPresets";

type IconRule = {
  keywords: string[];
  icon: string;
  tint?: string;
};

const RULES: IconRule[] = [
  { keywords: ["ความรู้", "유용한", "지식", "info"], icon: "📚", tint: "bg-sky-100" },
  { keywords: ["ฮอต", "hot", "올리브", "olive", "뷰티", "beauty"], icon: "🔥", tint: "bg-pink-100" },
  { keywords: ["หางาน", "งาน", "구인", "job"], icon: "💼", tint: "bg-emerald-100" },
  { keywords: ["รีวิว", "สถานที่", "ร้าน", "장소", "review"], icon: "📍", tint: "bg-rose-100" },
  { keywords: ["หิ้ว", "ช้อป", "ซื้อ", "구매", "shop"], icon: "🛍️", tint: "bg-violet-100" },
  { keywords: ["อาหาร", "ส่งอาหาร", "ร้านอาหาร", "음식", "food"], icon: "🍜", tint: "bg-orange-100" },
  { keywords: ["พรีเมียม", "premium", "프리미엄"], icon: "👑", tint: "bg-amber-100" },
  { keywords: ["ช้อปปิ้ง", "shopping", "쇼핑"], icon: "🛒", tint: "bg-lime-100" },
  { keywords: ["ที่พัก", "โรงแรม", "숙박", "hotel"], icon: "🛏️", tint: "bg-indigo-100" },
  { keywords: ["สุขภาพ", "โรงพยาบาล", "건강", "health"], icon: "🩺", tint: "bg-red-100" },
  { keywords: ["เดินทาง", "รถ", "แท็กซี่", "교통", "transport"], icon: "🚕", tint: "bg-yellow-100" },
  { keywords: ["การศึกษา", "เรียน", "교육", "edu"], icon: "🎓", tint: "bg-purple-100" },
  { keywords: ["บริการ", "ช่าง", "서비스", "service"], icon: "🔧", tint: "bg-slate-100" },
  { keywords: ["กาแฟ", "คาเฟ่", "cafe"], icon: "☕", tint: "bg-amber-100" },
  { keywords: ["ธนาคาร", "เงิน", "은행", "bank"], icon: "🏦", tint: "bg-amber-100" },
  { keywords: ["วีซ่า", "비자", "visa"], icon: "🛂", tint: "bg-sky-100" },
  { keywords: ["โทรศัพท์", "มือถือ", "통신", "phone"], icon: "📱", tint: "bg-sky-100" },
  { keywords: ["บ้าน", "ที่อยู่", "주거", "home"], icon: "🏠", tint: "bg-indigo-100" },
  { keywords: ["สวย", "ความงาม", "미용", "beauty"], icon: "💄", tint: "bg-rose-100" },
  { keywords: ["สัตว์", "pet"], icon: "🐾", tint: "bg-lime-100" },
  { keywords: ["กีฬา", "sport"], icon: "⚽", tint: "bg-emerald-100" },
  { keywords: ["เด็ก", "kid", "육아", "아이"], icon: "👶", tint: "bg-sky-100" },
  { keywords: ["게시", "board", "게시판", "커뮤니티", "community"], icon: "📋", tint: "bg-sky-100" },
  { keywords: ["맛집", "restaurant", "식당"], icon: "🍽️", tint: "bg-orange-100" },
  { keywords: ["구인구직", "채용", "hire"], icon: "💼", tint: "bg-emerald-100" },
  { keywords: ["구매대행", "대행", "proxy"], icon: "🛍️", tint: "bg-violet-100" },
  { keywords: ["배달", "delivery"], icon: "🛵", tint: "bg-orange-100" },
  { keywords: ["중고", "used", "มือสอง"], icon: "♻️", tint: "bg-lime-100" },
  { keywords: ["질문", "qa", "q&a", "ถาม"], icon: "❓", tint: "bg-purple-100" },
  { keywords: ["공지", "notice", "ประกาศ"], icon: "📣", tint: "bg-amber-100" },
  { keywords: ["채팅", "chat", "แชท"], icon: "💬", tint: "bg-sky-100" },
  { keywords: ["화장품", "cosmetic", "เครื่องสำอาง"], icon: "💄", tint: "bg-rose-100" },
  { keywords: ["전자", "electronics", "มือถือ"], icon: "📱", tint: "bg-slate-100" },
  { keywords: ["명품", "luxury", "แบรนด์"], icon: "💎", tint: "bg-amber-100" },
  { keywords: ["신발", "shoes", "รองเท้า"], icon: "👟", tint: "bg-lime-100" },
  { keywords: ["과자", "snack", "ขนม"], icon: "🍪", tint: "bg-orange-100" },
  { keywords: ["영양제", "supplement", "วิตามิน"], icon: "💊", tint: "bg-emerald-100" },
  { keywords: ["여행", "travel", "ท่องเที่ยว"], icon: "✈️", tint: "bg-indigo-100" },
  { keywords: ["번역", "translate", "แปล"], icon: "🌐", tint: "bg-sky-100" },
  { keywords: ["법률", "legal", "กฎหมาย"], icon: "⚖️", tint: "bg-slate-100" },
  { keywords: ["보험", "insurance", "ประกัน"], icon: "🛡️", tint: "bg-blue-100" },
  { keywords: ["세금", "tax", "ภาษี"], icon: "🧾", tint: "bg-yellow-100" },
  { keywords: ["이민", "immigration"], icon: "🛂", tint: "bg-sky-100" },
];

const DEFAULT_ICON = "📌";

const TEMPLATE_HINTS: Record<string, string> = {
  place: "장소 review รีวิว",
  job: "구인 job หางาน",
  article: "게시 board",
};

export function suggestMenuIconFromTexts(
  ...texts: (string | undefined | null)[]
): { icon: string; tint: string } {
  const combined = texts
    .filter((text): text is string => Boolean(text?.trim()))
    .join(" ");
  return suggestMenuIcon(combined);
}

export function suggestMenuIconForTemplate(
  templateId: string,
  ...texts: (string | undefined | null)[]
): { icon: string; tint: string } {
  const hint = TEMPLATE_HINTS[templateId] ?? "";
  return suggestMenuIconFromTexts(...texts, hint);
}

export function suggestMenuIcon(text: string): { icon: string; tint: string } {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return { icon: DEFAULT_ICON, tint: DEFAULT_MENU_TINT };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return {
        icon: rule.icon,
        tint: rule.tint ?? DEFAULT_MENU_TINT,
      };
    }
  }

  return { icon: DEFAULT_ICON, tint: MENU_TINT_PRESETS[0].className };
}

export const DEFAULT_SUB_DESCRIPTION_TH =
  "ดูโพสต์และเขียนในหมวดหมู่นี้";
