const CONSENT_STORAGE_KEY = 'mijersey-tracking-consent';

export type ConsentChoice = Record<string, boolean>;

/** El consentimiento se persiste solo en el navegador del visitante (localStorage), no en el backend — mismo criterio que el carrito de invitado y el historial de búsquedas de este storefront: no existe todavía una sesión de invitado a nivel de backend a la cual asociarlo (033 §4 "respetar el consentimiento del usuario"). */
export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoice) : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
}

export function grantedCategoriesFrom(choice: ConsentChoice): string[] {
  return Object.entries(choice)
    .filter(([, granted]) => granted)
    .map(([category]) => category);
}
