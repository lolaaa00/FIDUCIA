// Form validators

export function isValidEthAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function isPositiveNumber(val: string | number): boolean {
  const n = Number(val);
  return !isNaN(n) && n > 0;
}

export function isNonEmpty(val: string): boolean {
  return val.trim().length > 0;
}
