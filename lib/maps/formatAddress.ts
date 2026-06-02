export function formatKoreanMapAddress(
  roadAddress?: string,
  jibunAddress?: string
): string {
  const road = roadAddress?.trim() ?? "";
  const jibun = jibunAddress?.trim() ?? "";

  if (road && jibun && road !== jibun) {
    return `${road} (지번 ${jibun})`;
  }

  return road || jibun;
}

export function buildDisplayAddress(input: {
  roadAddress?: string;
  jibunAddress?: string;
  fallback?: string;
}): string {
  const formatted = formatKoreanMapAddress(input.roadAddress, input.jibunAddress);
  return formatted || input.fallback?.trim() || "";
}
