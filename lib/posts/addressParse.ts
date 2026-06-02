import { normalizeAddressKey } from "./address";
import {
  canonicalizeSido,
  KOREAN_SIDO_ALIASES,
  KOREAN_SIDO_LIST,
  KOREAN_SIGUNGU_BY_SIDO,
} from "./koreanRegions";
import type { Post } from "./types";

export type ParsedAddressParts = {
  sido: string;
  sigungu: string;
  dong: string;
  label: string;
};

export type AddressTreeLevel = "sido" | "sigungu" | "dong";

export type AddressTreeNode = {
  key: string;
  label: string;
  level: AddressTreeLevel;
  postCount: number;
  children: AddressTreeNode[];
};

export type AddressTreeSelection = {
  sido: string;
  sigungu?: string;
  dong?: string;
} | null;

const NO_ADDRESS_SIDO = "__no_address__";
const UNCLASSIFIED_SIDO = "__unclassified__";
const NO_ADDRESS_SIGUNGU = "__unknown__";
const NO_ADDRESS_DONG = "__unknown__";

const SORTED_SIDO_LIST = [...KOREAN_SIDO_LIST].sort(
  (a, b) => b.length - a.length
);

const SORTED_SIDO_ALIASES = Object.entries(KOREAN_SIDO_ALIASES).sort(
  ([a], [b]) => b.length - a.length
);

const SIGUNGU_TO_SIDOS = (() => {
  const map = new Map<string, string[]>();
  for (const [sido, list] of Object.entries(KOREAN_SIGUNGU_BY_SIDO)) {
    const canonical = canonicalizeSido(sido);
    for (const sigungu of list) {
      const existing = map.get(sigungu) ?? [];
      if (!existing.includes(canonical)) {
        existing.push(canonical);
      }
      map.set(sigungu, existing);
    }
  }
  return [...map.entries()].sort(([a], [b]) => b.length - a.length);
})();

const DONG_PATTERN = /[가-힣]+(?:동|읍|면|리)(?:\s+\d+(?:-\d+)?)?/;
const SIGUNGU_DISTRICT_PATTERN =
  /[가-힣]+(?:시|군|구)\s+[가-힣]+(?:구|군)/;

function extractDong(value: string): string {
  const match = value.match(DONG_PATTERN);
  return match?.[0]?.trim() ?? "";
}

function findSido(address: string): string {
  for (const sido of SORTED_SIDO_LIST) {
    if (address.includes(sido)) {
      return canonicalizeSido(sido);
    }
  }

  for (const [alias, sido] of SORTED_SIDO_ALIASES) {
    if (address.includes(alias)) {
      return canonicalizeSido(sido);
    }
  }

  return "";
}

function inferFromSigungu(
  address: string
): { sido: string; sigungu: string } | null {
  let bestMatch: { sigungu: string; sidos: string[] } | null = null;

  for (const [sigungu, sidos] of SIGUNGU_TO_SIDOS) {
    if (!address.includes(sigungu)) {
      continue;
    }

    if (!bestMatch || sigungu.length > bestMatch.sigungu.length) {
      bestMatch = { sigungu, sidos };
    }
  }

  if (!bestMatch) {
    return null;
  }

  if (bestMatch.sidos.length === 1) {
    return { sido: bestMatch.sidos[0], sigungu: bestMatch.sigungu };
  }

  const partialSido = findSido(address);
  if (partialSido && bestMatch.sidos.includes(partialSido)) {
    return { sido: partialSido, sigungu: bestMatch.sigungu };
  }

  return null;
}

function findSigungu(address: string, sido: string): string {
  const districtMatch = address.match(SIGUNGU_DISTRICT_PATTERN);
  if (districtMatch) {
    const parts = districtMatch[0].split(/\s+/);
    return parts[parts.length - 1] ?? parts[0] ?? "";
  }

  const candidates = KOREAN_SIGUNGU_BY_SIDO[sido] ?? [];
  let bestMatch = "";
  for (const candidate of candidates) {
    if (address.includes(candidate) && candidate.length > bestMatch.length) {
      bestMatch = candidate;
    }
  }
  if (bestMatch) {
    return bestMatch;
  }

  const fallback = address.match(/[가-힣]+(?:시|군|구)/g);
  if (fallback?.length) {
    return fallback.find((token) => token !== sido) ?? fallback[0] ?? "";
  }

  return "";
}

export function parseKoreanAddress(address: string): ParsedAddressParts {
  const normalized = normalizeAddressKey(address);
  if (!normalized) {
    return {
      sido: NO_ADDRESS_SIDO,
      sigungu: NO_ADDRESS_SIGUNGU,
      dong: NO_ADDRESS_DONG,
      label: "",
    };
  }

  let sido = findSido(normalized);
  let sigungu = "";

  if (!sido) {
    const inferred = inferFromSigungu(normalized);
    if (inferred) {
      sido = inferred.sido;
      sigungu = inferred.sigungu;
    }
  }

  if (sido && !sigungu) {
    sigungu = findSigungu(normalized, sido) || NO_ADDRESS_SIGUNGU;
  }

  const dong = extractDong(normalized) || NO_ADDRESS_DONG;

  if (!sido) {
    return {
      sido: UNCLASSIFIED_SIDO,
      sigungu: normalized,
      dong,
      label: normalized,
    };
  }

  const labelParts = [
    sido,
    sigungu !== NO_ADDRESS_SIGUNGU ? sigungu : "",
    dong !== NO_ADDRESS_DONG ? dong : "",
  ].filter(Boolean);

  return {
    sido,
    sigungu,
    dong,
    label: labelParts.length > 0 ? labelParts.join(" ") : normalized,
  };
}

export function parseKoreanAddressFromGeocode(input: {
  region1?: string;
  region2?: string;
  region3?: string;
  addressName?: string;
}): ParsedAddressParts | null {
  const region1 = input.region1?.trim() ?? "";
  const region2 = input.region2?.trim() ?? "";
  const region3 = input.region3?.trim() ?? "";
  const addressName = input.addressName?.trim() ?? "";

  if (!region1 && !addressName) {
    return null;
  }

  const combined = normalizeAddressKey(
    [region1, region2, region3, addressName].filter(Boolean).join(" ")
  );
  const local = parseKoreanAddress(combined);

  if (local.sido !== NO_ADDRESS_SIDO && local.sido !== UNCLASSIFIED_SIDO) {
    return {
      ...local,
      sigungu:
        region2 && local.sigungu === NO_ADDRESS_SIGUNGU
          ? region2
          : local.sigungu,
      dong:
        region3 && local.dong === NO_ADDRESS_DONG ? region3 : local.dong,
      label: combined || local.label,
    };
  }

  const fromRegions = parseKoreanAddress(
    normalizeAddressKey([region1, region2, region3].filter(Boolean).join(" "))
  );

  if (
    fromRegions.sido !== NO_ADDRESS_SIDO &&
    fromRegions.sido !== UNCLASSIFIED_SIDO
  ) {
    return {
      ...fromRegions,
      label: combined || fromRegions.label,
    };
  }

  if (combined) {
    return {
      sido: UNCLASSIFIED_SIDO,
      sigungu: combined,
      dong: region3 || NO_ADDRESS_DONG,
      label: combined,
    };
  }

  return null;
}

export function getPostParsedAddress(post: Post): ParsedAddressParts {
  const source = post.address?.trim() || post.addressKey?.trim() || "";
  return parseKoreanAddress(source);
}

function nodeKey(level: AddressTreeLevel, parts: ParsedAddressParts): string {
  if (level === "sido") {
    return `sido:${parts.sido}`;
  }
  if (level === "sigungu") {
    return `sigungu:${parts.sido}|${parts.sigungu}`;
  }
  return `dong:${parts.sido}|${parts.sigungu}|${parts.dong}`;
}

function formatTreeLabel(
  level: AddressTreeLevel,
  parts: ParsedAddressParts,
  noAddressLabel: string,
  unclassifiedLabel: string
): string {
  if (parts.sido === NO_ADDRESS_SIDO) {
    return noAddressLabel;
  }

  if (parts.sido === UNCLASSIFIED_SIDO) {
    if (level === "sido") {
      return unclassifiedLabel;
    }
    if (level === "sigungu") {
      return parts.label || parts.sigungu || unclassifiedLabel;
    }
    return parts.dong === NO_ADDRESS_DONG
      ? parts.label || unclassifiedLabel
      : parts.dong;
  }

  if (level === "sido") {
    return parts.sido;
  }
  if (level === "sigungu") {
    return parts.sigungu === NO_ADDRESS_SIGUNGU
      ? unclassifiedLabel
      : parts.sigungu;
  }
  return parts.dong === NO_ADDRESS_DONG ? parts.label || parts.sigungu : parts.dong;
}

function sortTreeNodes(a: AddressTreeNode, b: AddressTreeNode): number {
  if (a.key.includes(NO_ADDRESS_SIDO)) {
    return 1;
  }
  if (b.key.includes(NO_ADDRESS_SIDO)) {
    return -1;
  }
  if (a.key.includes(UNCLASSIFIED_SIDO)) {
    return 1;
  }
  if (b.key.includes(UNCLASSIFIED_SIDO)) {
    return -1;
  }
  return a.label.localeCompare(b.label, "ko");
}

function sortTreeDeep(nodes: AddressTreeNode[]): AddressTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: sortTreeDeep(node.children),
    }))
    .sort(sortTreeNodes);
}

export function buildAddressTree(
  posts: Post[],
  noAddressLabel: string,
  unclassifiedLabel?: string
): AddressTreeNode[] {
  const unclassified = unclassifiedLabel ?? noAddressLabel;
  const rootMap = new Map<string, AddressTreeNode>();

  for (const post of posts) {
    const parts = getPostParsedAddress(post);

    const sidoKey = nodeKey("sido", parts);
    let sidoNode = rootMap.get(sidoKey);
    if (!sidoNode) {
      sidoNode = {
        key: sidoKey,
        label: formatTreeLabel("sido", parts, noAddressLabel, unclassified),
        level: "sido",
        postCount: 0,
        children: [],
      };
      rootMap.set(sidoKey, sidoNode);
    }
    sidoNode.postCount += 1;

    const sigunguKey = nodeKey("sigungu", parts);
    let sigunguNode = sidoNode.children.find((item) => item.key === sigunguKey);
    if (!sigunguNode) {
      sigunguNode = {
        key: sigunguKey,
        label: formatTreeLabel("sigungu", parts, noAddressLabel, unclassified),
        level: "sigungu",
        postCount: 0,
        children: [],
      };
      sidoNode.children.push(sigunguNode);
    }
    sigunguNode.postCount += 1;

    const dongKey = nodeKey("dong", parts);
    let dongNode = sigunguNode.children.find((item) => item.key === dongKey);
    if (!dongNode) {
      dongNode = {
        key: dongKey,
        label: formatTreeLabel("dong", parts, noAddressLabel, unclassified),
        level: "dong",
        postCount: 0,
        children: [],
      };
      sigunguNode.children.push(dongNode);
    }
    dongNode.postCount += 1;
  }

  return sortTreeDeep([...rootMap.values()]);
}

export function selectionFromTreeKey(key: string): AddressTreeSelection {
  if (key.startsWith("sido:")) {
    return { sido: key.slice("sido:".length) };
  }
  if (key.startsWith("sigungu:")) {
    const [, payload] = key.split("sigungu:");
    const [sido, sigungu] = (payload ?? "").split("|");
    if (!sido || !sigungu) {
      return null;
    }
    return { sido, sigungu };
  }
  if (key.startsWith("dong:")) {
    const [, payload] = key.split("dong:");
    const [sido, sigungu, dong] = (payload ?? "").split("|");
    if (!sido || !sigungu || !dong) {
      return null;
    }
    return { sido, sigungu, dong };
  }
  return null;
}

export function formatAddressSelectionLabel(
  selection: AddressTreeSelection,
  noAddressLabel: string
): string {
  if (!selection) {
    return "";
  }

  const parts = [selection.sido, selection.sigungu, selection.dong].filter(
    (part) =>
      part &&
      part !== NO_ADDRESS_SIDO &&
      part !== UNCLASSIFIED_SIDO &&
      part !== NO_ADDRESS_SIGUNGU &&
      part !== NO_ADDRESS_DONG
  );

  if (parts.length === 0) {
    return noAddressLabel;
  }

  return parts.join(" ");
}

function matchesSelection(
  parts: ParsedAddressParts,
  selection: AddressTreeSelection
): boolean {
  if (!selection) {
    return true;
  }

  if (parts.sido !== selection.sido) {
    return false;
  }

  if (selection.sigungu && parts.sigungu !== selection.sigungu) {
    return false;
  }

  if (selection.dong && parts.dong !== selection.dong) {
    return false;
  }

  return true;
}

export function filterPostsByAddressSelection(
  posts: Post[],
  selection: AddressTreeSelection
): Post[] {
  if (!selection) {
    return posts;
  }

  return posts.filter((post) =>
    matchesSelection(getPostParsedAddress(post), selection)
  );
}

export function filterPostsByAddressSearch(
  posts: Post[],
  query: string
): Post[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return posts;
  }

  return posts.filter((post) => {
    const parts = getPostParsedAddress(post);
    const haystack = [
    post.address,
    post.addressKey,
    post.displayAddress,
    post.roadAddress,
    post.jibunAddress,
    post.storeName,
      post.title,
      parts.label,
      parts.sido,
      parts.sigungu,
      parts.dong,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export async function enrichAddressWithGeocode(
  address: string
): Promise<ParsedAddressParts | null> {
  const normalized = normalizeAddressKey(address);
  if (!normalized) {
    return null;
  }

  try {
    const response = await fetch(
      `/api/geocode?q=${encodeURIComponent(normalized)}`
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      ok?: boolean;
      geocode?: {
        parsed?: ParsedAddressParts;
        displayAddress?: string;
      };
      parsed?: ParsedAddressParts;
    };

    const parsed = data.geocode?.parsed ?? data.parsed;
    return data.ok && parsed ? parsed : null;
  } catch {
    return null;
  }
}

export async function buildAddressTreeWithGeocode(
  posts: Post[],
  noAddressLabel: string,
  unclassifiedLabel?: string
): Promise<AddressTreeNode[]> {
  const uniqueAddresses = [
    ...new Set(
      posts
        .map((post) => post.address?.trim() || post.addressKey?.trim() || "")
        .filter(Boolean)
    ),
  ];

  const geocodeCache = new Map<string, ParsedAddressParts>();
  const limited = uniqueAddresses.filter((address) => {
    const local = parseKoreanAddress(address);
    return (
      local.sido === NO_ADDRESS_SIDO ||
      local.sido === UNCLASSIFIED_SIDO ||
      local.sigungu === NO_ADDRESS_SIGUNGU ||
      local.dong === NO_ADDRESS_DONG
    );
  });

  await Promise.all(
    limited.slice(0, 24).map(async (address) => {
      const enriched = await enrichAddressWithGeocode(address);
      if (enriched) {
        geocodeCache.set(address, enriched);
      }
    })
  );

  const enrichedPosts = posts.map((post) => {
    const source = post.address?.trim() || post.addressKey?.trim() || "";
    const enriched = geocodeCache.get(source);
    if (!enriched) {
      return post;
    }

    return {
      ...post,
      address: enriched.label || post.address,
      addressKey: enriched.label || post.addressKey,
    };
  });

  return buildAddressTree(enrichedPosts, noAddressLabel, unclassifiedLabel);
}

export function isValidAddressPart(value: string | undefined): boolean {
  return Boolean(
    value &&
      value !== NO_ADDRESS_SIDO &&
      value !== UNCLASSIFIED_SIDO &&
      value !== NO_ADDRESS_SIGUNGU &&
      value !== NO_ADDRESS_DONG
  );
}

export function treeKeyFromParsedParts(parts: ParsedAddressParts): string | null {
  if (!isValidAddressPart(parts.sido)) {
    return null;
  }

  if (isValidAddressPart(parts.dong) && isValidAddressPart(parts.sigungu)) {
    return `dong:${parts.sido}|${parts.sigungu}|${parts.dong}`;
  }

  if (isValidAddressPart(parts.sigungu)) {
    return `sigungu:${parts.sido}|${parts.sigungu}`;
  }

  return `sido:${parts.sido}`;
}

function keyExistsInTree(nodes: AddressTreeNode[], key: string): boolean {
  for (const node of nodes) {
    if (node.key === key) {
      return true;
    }
    if (keyExistsInTree(node.children, key)) {
      return true;
    }
  }
  return false;
}

function findNodeByKey(
  nodes: AddressTreeNode[],
  key: string
): AddressTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    const found = findNodeByKey(node.children, key);
    if (found) {
      return found;
    }
  }
  return null;
}

export function findBestTreeKeyInAddressTree(
  tree: AddressTreeNode[],
  parts: ParsedAddressParts
): string | null {
  const candidates: string[] = [];
  const fallback = treeKeyFromParsedParts(parts);
  if (fallback) {
    if (fallback.startsWith("dong:")) {
      candidates.push(fallback);
    }
    if (isValidAddressPart(parts.sigungu)) {
      candidates.push(`sigungu:${parts.sido}|${parts.sigungu}`);
    }
    candidates.push(`sido:${parts.sido}`);
  }

  for (const key of candidates) {
    if (keyExistsInTree(tree, key)) {
      return key;
    }
  }

  return fallback;
}

export function filterAddressTreeForSearch(
  tree: AddressTreeNode[],
  parts: ParsedAddressParts | null
): AddressTreeNode[] {
  if (!parts || !isValidAddressPart(parts.sido)) {
    return tree;
  }

  const sidoKey = `sido:${parts.sido}`;
  const sidoNode = findNodeByKey(tree, sidoKey);
  if (!sidoNode) {
    return tree.filter(
      (node) =>
        node.key === sidoKey ||
        node.label.includes(parts.sido) ||
        node.key.includes(parts.sido)
    );
  }

  if (!isValidAddressPart(parts.sigungu)) {
    return [sidoNode];
  }

  const sigunguKey = `sigungu:${parts.sido}|${parts.sigungu}`;
  const sigunguNode = findNodeByKey(sidoNode.children, sigunguKey);
  if (!sigunguNode) {
    return [
      {
        ...sidoNode,
        children: sidoNode.children.filter(
          (node) =>
            node.key === sigunguKey ||
            node.label.includes(parts.sigungu) ||
            node.key.includes(parts.sigungu)
        ),
      },
    ];
  }

  if (!isValidAddressPart(parts.dong)) {
    return [{ ...sidoNode, children: [sigunguNode] }];
  }

  const dongKey = `dong:${parts.sido}|${parts.sigungu}|${parts.dong}`;
  const dongNode = findNodeByKey(sigunguNode.children, dongKey);
  if (!dongNode) {
    return [
      {
        ...sidoNode,
        children: [
          {
            ...sigunguNode,
            children: sigunguNode.children.filter(
              (node) =>
                node.key === dongKey ||
                node.label.includes(parts.dong) ||
                node.key.includes(parts.dong)
            ),
          },
        ],
      },
    ];
  }

  return [
    {
      ...sidoNode,
      children: [{ ...sigunguNode, children: [dongNode] }],
    },
  ];
}

export type AddressSearchClassification = {
  parts: ParsedAddressParts;
  displayAddress?: string;
  roadAddress?: string;
  jibunAddress?: string;
};

export function getAddressClassificationLevels(
  parts: ParsedAddressParts,
  emptyLabel: string
): { sido: string; sigungu: string; dong: string } {
  return {
    sido: isValidAddressPart(parts.sido) ? parts.sido : emptyLabel,
    sigungu: isValidAddressPart(parts.sigungu) ? parts.sigungu : emptyLabel,
    dong: isValidAddressPart(parts.dong) ? parts.dong : emptyLabel,
  };
}
