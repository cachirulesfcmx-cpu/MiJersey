const SESSION_STORAGE_KEY = 'mijersey-search-session-id';

/** Id anónimo persistido en localStorage — no existe todavía un concepto de sesión de invitado en el backend (016), así que el storefront genera el suyo para "historial de búsquedas". */
export function getSearchSessionId(): string {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}
