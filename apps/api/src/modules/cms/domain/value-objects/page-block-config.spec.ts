import { PageBlockType, validatePageBlockConfig } from './page-block-config';

describe('validatePageBlockConfig', () => {
  it('accepts a valid RICH_TEXT block', () => {
    expect(validatePageBlockConfig(PageBlockType.RICH_TEXT, { html: '<p>hi</p>' })).toBeNull();
  });

  it('rejects a RICH_TEXT block without html', () => {
    expect(validatePageBlockConfig(PageBlockType.RICH_TEXT, {})).toBe('html es obligatorio');
  });

  it('accepts a valid IMAGE block', () => {
    expect(
      validatePageBlockConfig(PageBlockType.IMAGE, { mediaUrl: 'https://x/y.png' }),
    ).toBeNull();
  });

  it('rejects an IMAGE block without mediaUrl', () => {
    expect(validatePageBlockConfig(PageBlockType.IMAGE, {})).toBe('mediaUrl es obligatorio');
  });

  it('accepts a valid HERO block', () => {
    expect(
      validatePageBlockConfig(PageBlockType.HERO, {
        imageUrl: 'https://x/y.png',
        headline: 'Hello',
      }),
    ).toBeNull();
  });

  it('rejects a HERO block missing headline', () => {
    expect(validatePageBlockConfig(PageBlockType.HERO, { imageUrl: 'https://x/y.png' })).toBe(
      'headline es obligatorio',
    );
  });

  it('accepts a valid CTA block', () => {
    expect(
      validatePageBlockConfig(PageBlockType.CTA, {
        headline: 'Hi',
        buttonLabel: 'Go',
        buttonUrl: 'https://x',
      }),
    ).toBeNull();
  });

  it('rejects a CTA block missing buttonUrl', () => {
    expect(validatePageBlockConfig(PageBlockType.CTA, { headline: 'Hi', buttonLabel: 'Go' })).toBe(
      'buttonUrl es obligatorio',
    );
  });

  it('accepts a SPACER block with no required fields', () => {
    expect(validatePageBlockConfig(PageBlockType.SPACER, {})).toBeNull();
  });

  it('rejects an unknown block type', () => {
    expect(validatePageBlockConfig('NOT_A_TYPE', {})).toBe(
      'Tipo de bloque desconocido: NOT_A_TYPE',
    );
  });
});
