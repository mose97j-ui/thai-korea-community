export function normalizeAddressKey(address: string): string {
  return address.trim().replace(/\s+/g, " ");
}

export function validateKoreanAddress(address: string): boolean {
  const trimmed = normalizeAddressKey(address);

  if (trimmed.length < 5 || trimmed.length > 200) {
    return false;
  }

  if (!/[가-힣]/.test(trimmed)) {
    return false;
  }

  const hasNumber = /\d/.test(trimmed);
  const hasAddressToken =
    /(특별|광역|자치|시|도|구|군|읍|면|동|리|로|길|번길|번지)/.test(trimmed);

  return hasNumber || hasAddressToken;
}

export function formatAddressLabel(addressKey: string): string {
  return addressKey;
}
