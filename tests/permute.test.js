import { test, expect } from 'bun:test';

// Import permutation functions directly from permutations.js
import { permutations } from '../src/search/permutations';

const { case: permuteCase, group: permuteGroup, url: permuteURL, wifi: permuteWifi } = permutations;

// permuteCase Tests
test('permuteCase: no caps enabled', () => {
  const comp = permuteCase('Hello123', { enableCaps: false });
  expect(comp.total).toBe(1);
  expect(comp.get(0)).toBe('Hello123');
  expect(comp.get(1)).toBe('Hello123'); // Should still return same string
});

test('permuteCase: caps enabled, only letters permute', () => {
  const comp = permuteCase('a1b/:+', { enableCaps: true });
  expect(comp.total).toBe(4); // 2^2 (only 'a' and 'b' vary)
  const results = [];
  for (let k = 0; k < comp.total; k++) {
    results.push(comp.get(k));
  }
  expect(results).toEqual(['a1b/:+', 'A1b/:+', 'a1B/:+', 'A1B/:+']);
});

test('permuteCase: all letters', () => {
  const comp = permuteCase('abc', { enableCaps: true });
  expect(comp.total).toBe(8); // 2^3 = 8
  expect(comp.get(0)).toBe('abc');
  expect(comp.get(1)).toBe('Abc');
  expect(comp.get(7)).toBe('ABC');
});

// permuteGroup Tests
test('permuteGroup: single component', () => {
  const comp = permuteGroup([permuteCase('test', { enableCaps: true })], { join: '' });
  expect(comp.total).toBe(16); // 2^4 = 16
  expect(comp.get(0)).toBe('test');
  expect(comp.get(15)).toBe('TEST');
});

test('permuteGroup: multiple components with static string', () => {
  const comp = permuteGroup([
    permuteCase('ab', { enableCaps: true }),
    '-',
    permuteCase('cd', { enableCaps: true })
  ], { join: '' });
  expect(comp.total).toBe(16); // 2^2 * 1 * 2^2 = 16
  const results = [];
  for (let k = 0; k < comp.total; k++) {
    results.push(comp.get(k));
  }
  expect(results).toContain('ab-cd');
  expect(results).toContain('AB-CD');
  expect(results.length).toBe(16);
});

// permuteURL Tests
test('permuteURL: no caps enabled', () => {
  const comp = permuteURL('https://qrs.art/tetris',{
    protocolCaps: false,
    domainCaps: false,
    pathCaps: false
  });
  expect(comp.total).toBe(1);
  expect(comp.get(0)).toBe('https://qrs.art/tetris');
});

test('permuteURL: protocol and path caps enabled', () => {
  const comp = permuteURL('https://qrs.art/tetris',{
    protocolCaps: true,
    domainCaps: false,
    pathCaps: true
  });
  // protocol 'https' (5 letters) = 2^5, path 'tetris' (6 letters) = 2^6, domain static = 1
  expect(comp.total).toBe(2048); // 2^5 * 2^6 = 2048
  expect(comp.get(0)).toBe('https://qrs.art/tetris');
  expect(comp.get(1)).toBe('https://qrs.art/Tetris');
  const results = new Set();
  for (let k = 0; k < comp.total; k++) {
    results.add(comp.get(k));
  }
  expect(results.size).toBe(2048); // Ensure all permutations are unique
});

// permuteWifi Tests
test('permuteWifi: basic credentials', () => {
  const comp = permuteWifi({ name: 'MyWifi', password: 'secret' });
  expect(comp.total).toBe(6); // 3! = 6 orders
  expect(comp.get(0)).toBe('WIFI:T:WPA;S:MyWifi;P:secret;;');
  expect(comp.get(1)).toBe('WIFI:T:WPA;P:secret;S:MyWifi;;');
  expect(comp.get(4)).toBe('WIFI:P:secret;S:MyWifi;T:WPA;;');
  const results = [];
  for (let k = 0; k < comp.total; k++) {
    results.push(comp.get(k));
  }
  expect(results.length).toBe(6);
  expect(new Set(results).size).toBe(6); // All unique
});

test('permuteWifi: empty credentials', () => {
  const comp = permuteWifi({ name: '', password: '' });
  expect(comp.total).toBe(6);
  expect(comp.get(0)).toBe('WIFI:T:WPA;S:;P:;;');
});