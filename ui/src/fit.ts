/** Deterministic text-fit classes: long names/rules get a smaller size class
 *  so every card fits its frame at every render size — no JS measuring. */
export const fitName = (s: string): string =>
  s.length >= 26 ? ' fit-xs' : s.length >= 18 ? ' fit-sm' : '';
export const fitText = (s?: string | null): string =>
  !s ? '' : s.length >= 150 ? ' fit-xs' : s.length >= 105 ? ' fit-sm' : '';
