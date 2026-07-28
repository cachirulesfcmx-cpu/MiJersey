import {
  extractEntityRefs,
  extractMediaIds,
  validateHomeSectionConfig,
} from './home-section-config';
import { HomeSectionType } from './home-section-enums';

describe('validateHomeSectionConfig', () => {
  it('requires imageMediaId and headline for HERO_BANNER', () => {
    expect(validateHomeSectionConfig(HomeSectionType.HERO_BANNER, {})).toMatch(/imageMediaId/);
    expect(
      validateHomeSectionConfig(HomeSectionType.HERO_BANNER, {
        imageMediaId: 'media-1',
        headline: 'Hola',
      }),
    ).toBeNull();
  });

  it('requires at least one banner with imageMediaId for BANNER_GRID', () => {
    expect(validateHomeSectionConfig(HomeSectionType.BANNER_GRID, { banners: [] })).toMatch(
      /banners/,
    );
    expect(
      validateHomeSectionConfig(HomeSectionType.BANNER_GRID, {
        banners: [{ imageMediaId: 'media-1' }],
      }),
    ).toBeNull();
  });

  it('requires productIds for FEATURED_PRODUCTS', () => {
    expect(validateHomeSectionConfig(HomeSectionType.FEATURED_PRODUCTS, {})).toMatch(/productIds/);
    expect(
      validateHomeSectionConfig(HomeSectionType.FEATURED_PRODUCTS, { productIds: ['p1'] }),
    ).toBeNull();
  });

  it('requires html for RICH_TEXT', () => {
    expect(validateHomeSectionConfig(HomeSectionType.RICH_TEXT, {})).toMatch(/html/);
    expect(validateHomeSectionConfig(HomeSectionType.RICH_TEXT, { html: '<p>hi</p>' })).toBeNull();
  });

  it('has no required fields for NEWSLETTER', () => {
    expect(validateHomeSectionConfig(HomeSectionType.NEWSLETTER, {})).toBeNull();
  });
});

describe('extractMediaIds', () => {
  it('collects imageMediaId and mobileImageMediaId for HERO_BANNER', () => {
    expect(
      extractMediaIds(HomeSectionType.HERO_BANNER, {
        imageMediaId: 'a',
        mobileImageMediaId: 'b',
        headline: 'Hi',
      }),
    ).toEqual(['a', 'b']);
  });

  it('collects every banner image for BANNER_GRID', () => {
    expect(
      extractMediaIds(HomeSectionType.BANNER_GRID, {
        banners: [{ imageMediaId: 'a' }, { imageMediaId: 'b' }],
      }),
    ).toEqual(['a', 'b']);
  });

  it('returns an empty list for types without embedded media', () => {
    expect(extractMediaIds(HomeSectionType.FEATURED_PRODUCTS, { productIds: ['p1'] })).toEqual([]);
    expect(extractMediaIds(HomeSectionType.NEWSLETTER, {})).toEqual([]);
  });
});

describe('extractEntityRefs', () => {
  it('extracts productIds only for FEATURED_PRODUCTS', () => {
    expect(
      extractEntityRefs(HomeSectionType.FEATURED_PRODUCTS, { productIds: ['p1', 'p2'] }),
    ).toEqual({
      productIds: ['p1', 'p2'],
      categoryIds: [],
      collectionIds: [],
      brandIds: [],
    });
  });

  it('returns all-empty refs for types with no entity references', () => {
    expect(extractEntityRefs(HomeSectionType.RICH_TEXT, { html: '<p>hi</p>' })).toEqual({
      productIds: [],
      categoryIds: [],
      collectionIds: [],
      brandIds: [],
    });
  });
});
