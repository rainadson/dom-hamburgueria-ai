export function positiveId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function queryPage(value: unknown): number | null {
  if (value === undefined) return 0;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export function querySearch(value: unknown): string | null {
  if (value === undefined) return "";
  if (typeof value !== "string") return null;
  const search = value.trim();
  return search.length <= 100 && /^[\p{L}\p{N} +@._-]*$/u.test(search) ? search : null;
}
