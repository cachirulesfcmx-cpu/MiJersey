import { ThemeSectionKey } from './theme-enums';
import { validateThemeSectionConfig } from './theme-section-config';

describe('validateThemeSectionConfig', () => {
  it('accepts an empty HEADER config', () => {
    expect(validateThemeSectionConfig(ThemeSectionKey.HEADER, {})).toBeNull();
  });

  it('accepts an empty LAYOUT config', () => {
    expect(validateThemeSectionConfig(ThemeSectionKey.LAYOUT, {})).toBeNull();
  });

  it('requires message on BANNER', () => {
    expect(validateThemeSectionConfig(ThemeSectionKey.BANNER, {})).toBe('message es obligatorio');
    expect(
      validateThemeSectionConfig(ThemeSectionKey.BANNER, { message: 'Envío gratis' }),
    ).toBeNull();
  });

  it('rejects a non-array FOOTER columns field', () => {
    expect(validateThemeSectionConfig(ThemeSectionKey.FOOTER, { columns: 'not-an-array' })).toBe(
      'columns debe ser un arreglo',
    );
  });

  it('rejects FOOTER columns missing a title or links', () => {
    expect(
      validateThemeSectionConfig(ThemeSectionKey.FOOTER, { columns: [{ title: 'Ayuda' }] }),
    ).toBe('cada columna requiere title y links');
  });

  it('accepts a well-formed FOOTER config', () => {
    expect(
      validateThemeSectionConfig(ThemeSectionKey.FOOTER, {
        columns: [{ title: 'Ayuda', links: [{ label: 'Contacto', url: '/contacto' }] }],
      }),
    ).toBeNull();
  });
});
