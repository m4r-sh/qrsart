import { permute as permute_url } from '../../src/data/formats/url'
import { describe, expect, test } from 'bun:test';

describe('permute url', () => {

  test('permute_url: { url }', () => {
    const comp = permute_url({ url: 'https://qrs.art/tetris' },{
      protocolCaps: false,
      hostnameCaps: false,
    });
    expect(comp.total).toBe(1);
    expect(comp.get(0)).toBe('https://qrs.art/tetris');
  });

  test('permute_url: { protocol, hostname, pathname, query, hash }', () => {
    const comp = permute_url({
      protocol: 'https',
      hostname: 'tetris.qrs.art'
    },{
      protocolCaps: true,
      hostnameCaps: false,
    });
    
    expect(comp.total).toBe(64);
    expect(comp.get(0)).toBe('HTTPS://tetris.qrs.art');
    expect(comp.get(1)).toBe('HTTPS://tetris.qrs.art/');
    expect(comp.get(2)).toBe('hTTPS://tetris.qrs.art');
    expect(comp.get(63)).toBe('https://tetris.qrs.art/');
  });

  test('combines raw search and structured query params', () => {
    const comp = permute_url({
      protocol: 'https',
      hostname: 'qrs.art',
      pathname: '/studio',
      search: '?page=1',
      query: { sort: 'new', empty: '', count: 0 },
      hash: '#content'
    }, {
      protocolCaps: false,
      hostnameCaps: false,
    });

    expect(comp.total).toBe(1);
    expect(comp.get(0)).toBe('https://qrs.art/studio?page=1&sort=new&empty=&count=0#content');
  });

  test('permutes search parameter order', () => {
    const comp = permute_url({
      protocol: 'https',
      hostname: 'qrs.art',
      pathname: '/go',
      search: '?a=1&b=2'
    }, {
      protocolCaps: false,
      hostnameCaps: false,
      searchOrdering: true
    });

    expect(comp.total).toBe(2);
    expect(comp.get(0)).toBe('https://qrs.art/go?a=1&b=2');
    expect(comp.get(1)).toBe('https://qrs.art/go?b=2&a=1');
  });

});
