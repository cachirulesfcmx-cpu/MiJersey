import {
  toPublicConfiguration,
  validateTrackingConfiguration,
} from './tracking-configuration.util';

describe('validateTrackingConfiguration', () => {
  it('returns no missing fields when the configuration is complete', () => {
    expect(validateTrackingConfiguration('GOOGLE_ANALYTICS_4', { measurementId: 'G-123' })).toEqual(
      [],
    );
  });

  it('reports missing required fields', () => {
    expect(validateTrackingConfiguration('GOOGLE_ANALYTICS_4', {})).toEqual(['measurementId']);
  });

  it('reports empty-string fields as missing', () => {
    expect(validateTrackingConfiguration('META_PIXEL', { pixelId: '  ' })).toEqual(['pixelId']);
  });

  it('requires both fields for Conversion API', () => {
    expect(validateTrackingConfiguration('CONVERSION_API', { pixelId: '123' })).toEqual([
      'accessToken',
    ]);
  });
});

describe('toPublicConfiguration', () => {
  it('keeps only the public-safe fields for a client-side provider', () => {
    expect(toPublicConfiguration('META_PIXEL', { pixelId: '123', internalNote: 'secret' })).toEqual(
      { pixelId: '123' },
    );
  });

  it('strips every field for Conversion API since none are public', () => {
    expect(
      toPublicConfiguration('CONVERSION_API', { pixelId: '123', accessToken: 'secret-token' }),
    ).toEqual({});
  });
});
