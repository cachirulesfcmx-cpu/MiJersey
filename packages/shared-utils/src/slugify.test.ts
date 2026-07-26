import { describe, expect, it } from 'vitest';

import { slugify } from './slugify.js';

describe('slugify', () => {
  it('lowercases and dasherizes spaces', () => {
    expect(slugify('Camiseta Local 2026')).toBe('camiseta-local-2026');
  });

  it('strips accents and diacritics', () => {
    expect(slugify('Camión Édición Ñandú')).toBe('camion-edicion-nandu');
  });

  it('collapses repeated separators and trims leading/trailing dashes', () => {
    expect(slugify('  --Hola!!  Mundo--  ')).toBe('hola-mundo');
  });
});
