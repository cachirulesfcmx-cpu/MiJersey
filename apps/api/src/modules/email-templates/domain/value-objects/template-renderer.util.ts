const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]*)\s*\}\}/g;

export interface RenderResult {
  output: string;
  missingVariables: string[];
}

/** Sin dependencia de un motor de templates (Handlebars/Mustache): la spec (031 §2 "variables dinámicas") solo pide sustitución simple `{{variable}}`, así que una regex minimalista alcanza — mismo criterio de "campos mínimos, no un esquema completo" aplicado en el resto del proyecto. Cada valor se escapa (spec §9 "sanitización del HTML") porque, a diferencia del propio HTML de la plantilla (autoría de staff, confiable), los valores de las variables pueden venir de datos de dominio con caracteres controlados por el usuario final (ej. el nombre de un cliente). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Extrae los nombres de variable `{{name}}` referenciados en un contenido, sin duplicados. */
export function extractVariableNames(content: string): string[] {
  const names = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]?.trim();
    if (name) names.add(name);
  }
  return [...names];
}

/** Sustituye `{{variable}}` por su valor (escapado por defecto). Las variables sin valor provisto se dejan en blanco y se reportan en `missingVariables`, para que el llamador (Test Send, o un futuro consumidor real) pueda decidir si eso es aceptable. */
export function renderTemplate(
  content: string,
  variables: Record<string, string>,
  options: { escape?: boolean } = {},
): RenderResult {
  const escape = options.escape ?? true;
  const missingVariables: string[] = [];

  const output = content.replace(VARIABLE_PATTERN, (_match, rawName: string) => {
    const name = rawName.trim();
    if (!name) return '';

    if (!(name in variables)) {
      missingVariables.push(name);
      return '';
    }

    const value = variables[name] ?? '';
    return escape ? escapeHtml(value) : value;
  });

  return { output, missingVariables: [...new Set(missingVariables)] };
}
