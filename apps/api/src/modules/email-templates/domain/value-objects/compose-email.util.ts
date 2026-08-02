import { renderTemplate } from './template-renderer.util';

/** Compone el HTML final de un correo: primero interpola las variables de negocio en el HTML de la plantilla (escapadas), y si hay layout, inserta ese resultado en el placeholder `{{content}}` del layout (sin escapar — es HTML ya resuelto, no un valor de variable) junto con `{{css}}` si el layout define estilos. Reutiliza el mismo motor de interpolación para ambos pasos en vez de un mecanismo de composición aparte. */
export function composeEmailHtml(
  templateHtml: string,
  variables: Record<string, string>,
  layout: { html: string; css: string | null } | null,
): { html: string; missingVariables: string[] } {
  const templateResult = renderTemplate(templateHtml, variables, { escape: true });

  if (!layout) {
    return { html: templateResult.output, missingVariables: templateResult.missingVariables };
  }

  const layoutResult = renderTemplate(
    layout.html,
    { content: templateResult.output, css: layout.css ?? '' },
    { escape: false },
  );

  return {
    html: layoutResult.output,
    missingVariables: templateResult.missingVariables,
  };
}
