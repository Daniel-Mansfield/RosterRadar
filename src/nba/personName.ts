/**
 * Normalize a person name for vendor cross-matching (BDL ↔ seed ↔ ESPN).
 * Lowercases, strips diacritics/punctuation — not for display.
 */
export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD") // decompose accents so "Traoré" → "Traore" + combining mark
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}
