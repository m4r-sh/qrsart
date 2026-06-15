import { permute as permute_geo } from '../../src/data/formats/geo'
import { describe, expect, test } from 'bun:test';

describe('permute_geo', () => {

  test('permute_geo: basic', () => {
    const comp = permute_geo({ latitude: 30.02103, longitude: 20.202 })
    expect(comp.total).toBe(1)
    expect(comp.get(0)).toBe('geo:30.02103,20.202')
  });

  test('permute_geo: altitude', () => {
    const comp = permute_geo({ latitude: 30.02103, longitude: 20.202, altitude: 20 })
    expect(comp.total).toBe(1)
    expect(comp.get(0)).toBe('geo:30.02103,20.202,20')
  });

  test('permute_geo: altitude', () => {
    const comp = permute_geo(
      { latitude: 30.02103, longitude: 20.202, altitude: 20 },
      {
        prefixCaps: false,
        varyPrecision: true,
        maxDecimals: 10,
        precision: 6
      }
    )
    expect(comp.total).toBe(48)
    expect(comp.get(0)).toBe('geo:30.02103,20.202,20')
  });
});