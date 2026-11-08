export interface ExpenseTypeWithKeywords {
  id: string;
  name: string;
  keywords?: string | null;
}

/** Split a comma/newline-separated keyword string into lowercase terms. */
export function parseKeywords(keywords?: string | null): string[] {
  return (keywords || "")
    .split(/[,\n]/)
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Guess the expense type from free-text detail.
 * Each type matches on its keywords plus its own name; the longest matching
 * term wins so specific phrases ("ส่งตัวอย่าง") beat generic ones ("ตัวอย่าง").
 */
export function guessExpenseType<T extends ExpenseTypeWithKeywords>(text: string, types: T[]): T | null {
  const haystack = text.trim().toLowerCase();
  if (!haystack) return null;
  let best: T | null = null;
  let bestLen = 0;
  for (const t of types) {
    const terms = [...parseKeywords(t.keywords), t.name.trim().toLowerCase()];
    for (const term of terms) {
      if (term && term.length > bestLen && haystack.includes(term)) {
        best = t;
        bestLen = term.length;
      }
    }
  }
  return best;
}
