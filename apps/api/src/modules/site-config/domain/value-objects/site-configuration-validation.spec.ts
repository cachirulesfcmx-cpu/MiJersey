import { validateSiteConfigurationInput } from './site-configuration-validation';

describe('validateSiteConfigurationInput', () => {
  it('accepts a fully valid partial update', () => {
    expect(
      validateSiteConfigurationInput({
        siteName: 'MiJersey',
        defaultDomain: 'mijersey.com',
        defaultLanguage: 'es',
        defaultCurrency: 'MXN',
        timezone: 'America/Mexico_City',
        locale: 'es-MX',
        supportEmail: 'soporte@mijersey.com',
      }),
    ).toBeNull();
  });

  it('accepts an empty input (no fields to update)', () => {
    expect(validateSiteConfigurationInput({})).toBeNull();
  });

  it('rejects an empty siteName', () => {
    expect(validateSiteConfigurationInput({ siteName: '   ' })).toBe(
      'siteName no puede estar vacío',
    );
  });

  it('rejects a malformed domain', () => {
    expect(validateSiteConfigurationInput({ defaultDomain: 'not a domain' })).toBe(
      'defaultDomain debe ser un dominio válido (ej. mijersey.com)',
    );
  });

  it('rejects a malformed language code', () => {
    expect(validateSiteConfigurationInput({ defaultLanguage: 'spanish' })).toBe(
      'defaultLanguage debe seguir el formato ISO 639-1 (ej. es, es-MX)',
    );
  });

  it('accepts a language code with region subtag', () => {
    expect(validateSiteConfigurationInput({ defaultLanguage: 'es-MX' })).toBeNull();
  });

  it('rejects a malformed currency code', () => {
    expect(validateSiteConfigurationInput({ defaultCurrency: 'mxn' })).toBe(
      'defaultCurrency debe ser un código ISO 4217 de 3 letras mayúsculas (ej. MXN)',
    );
  });

  it('rejects an invalid IANA timezone', () => {
    expect(validateSiteConfigurationInput({ timezone: 'Not/A_Timezone' })).toBe(
      'timezone debe ser un identificador IANA válido (ej. America/Mexico_City)',
    );
  });

  it('rejects a malformed locale', () => {
    expect(validateSiteConfigurationInput({ locale: 'esMX' })).toBe(
      'locale debe seguir el formato BCP 47 (ej. es-MX)',
    );
  });

  it('rejects a malformed support email', () => {
    expect(validateSiteConfigurationInput({ supportEmail: 'not-an-email' })).toBe(
      'supportEmail debe ser un correo válido',
    );
  });
});
