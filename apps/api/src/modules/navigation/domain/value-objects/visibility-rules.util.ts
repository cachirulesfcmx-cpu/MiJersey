/** Reglas de visibilidad por contexto (spec 028 §2/§4) — forma mínima libre: si `authenticated` está presente, el ítem solo se muestra cuando coincide con el contexto; si `devices` está presente, solo se muestra para esos dispositivos. Sin reglas, el ítem siempre es visible. */
export interface VisibilityRules {
  authenticated?: boolean;
  devices?: string[];
}

export interface VisibilityContext {
  authenticated: boolean;
  device: string | null;
}

export function evaluateVisibility(
  rules: VisibilityRules | null | undefined,
  context: VisibilityContext,
): boolean {
  if (!rules) return true;

  if (typeof rules.authenticated === 'boolean' && rules.authenticated !== context.authenticated) {
    return false;
  }

  if (
    Array.isArray(rules.devices) &&
    rules.devices.length > 0 &&
    (!context.device || !rules.devices.includes(context.device))
  ) {
    return false;
  }

  return true;
}
