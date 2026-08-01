export enum PageBlockType {
  RICH_TEXT = 'RICH_TEXT',
  IMAGE = 'IMAGE',
  HTML = 'HTML',
  HERO = 'HERO',
  CTA = 'CTA',
  SPACER = 'SPACER',
}

export interface RichTextBlockConfig {
  html: string;
}

export interface ImageBlockConfig {
  mediaUrl: string;
  alt?: string;
  linkUrl?: string;
}

export interface HtmlBlockConfig {
  html: string;
}

export interface HeroBlockConfig {
  imageUrl: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface CtaBlockConfig {
  headline: string;
  buttonLabel: string;
  buttonUrl: string;
}

export interface SpacerBlockConfig {
  height?: number;
}

export type PageBlockConfiguration = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validación mínima de forma por tipo de bloque — no un esquema completo, solo lo suficiente para detectar configuraciones incompletas antes de guardarlas. Mismo criterio que `validateHomeSectionConfig` (013). */
export function validatePageBlockConfig(
  type: string,
  config: PageBlockConfiguration,
): string | null {
  switch (type) {
    case PageBlockType.RICH_TEXT: {
      const c = config as Partial<RichTextBlockConfig>;
      if (!isNonEmptyString(c.html)) return 'html es obligatorio';
      return null;
    }
    case PageBlockType.IMAGE: {
      const c = config as Partial<ImageBlockConfig>;
      if (!isNonEmptyString(c.mediaUrl)) return 'mediaUrl es obligatorio';
      return null;
    }
    case PageBlockType.HTML: {
      const c = config as Partial<HtmlBlockConfig>;
      if (!isNonEmptyString(c.html)) return 'html es obligatorio';
      return null;
    }
    case PageBlockType.HERO: {
      const c = config as Partial<HeroBlockConfig>;
      if (!isNonEmptyString(c.imageUrl)) return 'imageUrl es obligatorio';
      if (!isNonEmptyString(c.headline)) return 'headline es obligatorio';
      return null;
    }
    case PageBlockType.CTA: {
      const c = config as Partial<CtaBlockConfig>;
      if (!isNonEmptyString(c.headline)) return 'headline es obligatorio';
      if (!isNonEmptyString(c.buttonLabel)) return 'buttonLabel es obligatorio';
      if (!isNonEmptyString(c.buttonUrl)) return 'buttonUrl es obligatorio';
      return null;
    }
    case PageBlockType.SPACER:
      return null;
    default:
      return `Tipo de bloque desconocido: ${type}`;
  }
}
