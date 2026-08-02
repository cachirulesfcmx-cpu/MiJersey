export interface EmailTemplateContentInput {
  subject: string;
  html: string;
  text: string;
}

function countOccurrences(content: string, token: string): number {
  return content.split(token).length - 1;
}

/** Detecta llaves de variable mal formadas (`{{` sin `}}` correspondiente, o viceversa) en un campo — evita publicar una plantilla que nunca podrá interpolarse correctamente. No valida que las variables referenciadas pertenezcan a un esquema de negocio (spec §4 "validar variables antes de publicar" se interpreta aquí como validación sintáctica, ya que la spec no define un catálogo cerrado de variables por `key`). */
function findUnbalancedBraces(content: string): boolean {
  return countOccurrences(content, '{{') !== countOccurrences(content, '}}');
}

/** Ejecutado antes de publicar (`PublishEmailTemplateUseCase`) — mismo criterio minimalista que `validateThemeSectionConfig` (029) y `validatePageBlockConfig` (026): valida forma, no reglas de negocio profundas. */
export function validateEmailTemplateForPublish(input: EmailTemplateContentInput): string | null {
  if (input.subject.trim().length === 0) return 'subject no puede estar vacío para publicar';
  if (input.html.trim().length === 0) return 'html no puede estar vacío para publicar';

  if (findUnbalancedBraces(input.subject)) return 'subject tiene llaves de variable sin cerrar';
  if (findUnbalancedBraces(input.html)) return 'html tiene llaves de variable sin cerrar';
  if (findUnbalancedBraces(input.text)) return 'text tiene llaves de variable sin cerrar';

  return null;
}
