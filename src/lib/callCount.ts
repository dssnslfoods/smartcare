/** Upper bound to catch typos (e.g. 1600 instead of 16). */
export const MAX_CALL_COUNT = 9999;

/**
 * Parse a user-entered call count. Returns a whole number in [1, MAX_CALL_COUNT],
 * or null if the input is blank, fractional, negative, zero or not a number.
 */
export function parseCallCount(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(/,/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < 1 || n > MAX_CALL_COUNT) return null;
  return n;
}
