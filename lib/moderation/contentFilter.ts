export type ContentFilterCategory = "profanity" | "sexual" | "spam";

export type ContentScanResult = {
  blocked: boolean;
  severity: "none" | "mild" | "severe";
  categories: ContentFilterCategory[];
  matchedTerms: string[];
};

type FilterRule = {
  category: ContentFilterCategory;
  severity: "mild" | "severe";
  patterns: RegExp[];
  labels: string[];
};

function normalizeForScan(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s.*\-_~!@#$%^&()+=[\]{}|\\/<>,"'`?:;]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/[@]/g, "a");
}

const RULES: FilterRule[] = [
  {
    category: "profanity",
    severity: "severe",
    labels: ["profanity"],
    patterns: [
      /시발|씨발|십발|sibal|shibal|fuck|f\*ck|motherfucker/i,
      /병신|븅신|ㅂㅅ|병1신|byungshin/i,
      /지랄|ㅈㄹ|jiral/i,
      /개새|개색|gsaek/i,
      /좆|ㅈ같|jot/i,
      /씹|siip|sshib/i,
      /nmcl|nml|nmc/i,
      /asshole|bitch|bastard/i,
      /ควย|เหี้ย|สัด/i,
    ],
  },
  {
    category: "sexual",
    severity: "severe",
    labels: ["sexual"],
    patterns: [
      /야동|porn|porno|sexvideo|av녀|19금/i,
      /섹스|sex|sexychat|nude|naked|onlyfans/i,
      /보지|자지|가슴사진|딜도|오르가즘/i,
      /오피|출장|조건만남|원나잇|매춘|성매매/i,
      /โป๊|หนังโป๊|เซ็กซ์|นัดเย็ด/i,
    ],
  },
];

export function scanContent(text: string): ContentScanResult {
  const normalized = normalizeForScan(text);
  const raw = text.toLowerCase();
  const categories = new Set<ContentFilterCategory>();
  const matchedTerms = new Set<string>();
  let severity: ContentScanResult["severity"] = "none";

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized) || pattern.test(raw)) {
        categories.add(rule.category);
        matchedTerms.add(rule.labels[0] ?? rule.category);
        if (rule.severity === "severe") {
          severity = "severe";
        } else if (severity !== "severe") {
          severity = "mild";
        }
      }
    }
  }

  return {
    blocked: severity !== "none",
    severity,
    categories: [...categories],
    matchedTerms: [...matchedTerms],
  };
}

export function joinContentParts(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("\n");
}
