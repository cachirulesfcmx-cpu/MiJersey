import { ShippingZoneEntity } from './shipping-zone.entity';

function buildZone(countries: string[], states: string[] = []): ShippingZoneEntity {
  return new ShippingZoneEntity({
    id: 'zone-1',
    name: 'Zona de prueba',
    countries,
    states,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ShippingZoneEntity.matches', () => {
  it('rejects a country outside the zone', () => {
    expect(buildZone(['MX']).matches('US', null)).toBe(false);
  });

  it('matches any state when the zone has no states configured', () => {
    expect(buildZone(['MX']).matches('MX', 'CDMX')).toBe(true);
    expect(buildZone(['MX']).matches('MX', null)).toBe(true);
  });

  it('matches only the configured states when states are set', () => {
    const zone = buildZone(['MX'], ['CDMX', 'JAL']);

    expect(zone.matches('MX', 'CDMX')).toBe(true);
    expect(zone.matches('MX', 'NL')).toBe(false);
    expect(zone.matches('MX', null)).toBe(false);
  });
});
