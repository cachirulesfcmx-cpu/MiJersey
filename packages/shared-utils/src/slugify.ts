const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Deriva un slug URL-safe a partir de un texto arbitrario (p. ej. el nombre de un producto). */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
