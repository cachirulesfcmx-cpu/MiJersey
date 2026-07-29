const RECENT_STORAGE_KEY = 'mijersey-recent-searches';
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): void {
  if (typeof window === 'undefined' || !term.trim()) return;
  const next = [term, ...getRecentSearches().filter((existing) => existing !== term)].slice(
    0,
    MAX_RECENT,
  );
  window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RECENT_STORAGE_KEY);
}
