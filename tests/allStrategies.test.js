import { expect, test } from "bun:test"
import { allStrategies, findMinimalSegmentation } from "../src/segments"

test('empty string', () => {
  const str = '';
  const version = 1;
  const ecl = 0;
  const strategies = Array.from(allStrategies(str, version, ecl));
  expect(strategies.length).toBe(1);
  expect(strategies[0].cost).toBe(0);
  expect(strategies[0].steps).toEqual([]);
});

test('single character', () => {
  const str = '1'; // Compatible with numeric, alpha, byte
  const version = 1;
  const ecl = 0;
  const strategies = Array.from(allStrategies(str, version, ecl));
  expect(strategies.length).toBe(3); // All three modes

  const costs = strategies.map(s => s.cost).sort();
  // Numeric: 4+10 +4 =18
  // Alpha: 4+9 +6 =19
  // Byte: 4+8 +8 =20
  expect(costs).toEqual([18, 19, 20]);
});

test('simple segmentation with same-mode switches', () => {
  const str = 'ab'; // Lowercase: byte only, but allows extend or switch to same
  const version = 1;
  const ecl = 0;
  const strategies = Array.from(allStrategies(str, version, ecl));
  expect(strategies.length).toBe(2); // Extend and switch to same

  const costs = strategies.map(s => s.cost).sort();
  // Extend: header(12) +8 +8 =28
  // Switch: 12+8 +12+8 =40
  expect(costs).toEqual([28, 40]);
});

test('segmentation breakpoints consistency', () => {
  const str = '0123a';
  const version = 1;
  const ecl = 0;
  const strategies = Array.from(allStrategies(str, version, ecl));

  // Find minimal cost strategy
  let minStrat = strategies[0];
  for (const s of strategies) {
    if (s.cost < minStrat.cost) minStrat = s;
  }

  const minimal = findMinimalSegmentation(str, version);
  expect(minStrat.cost).toBe(minimal.cost);
  expect(minStrat.steps).toEqual(minimal.steps); // ['numeric','numeric','numeric','numeric','byte']
});

test('multiple strategies for mixed modes', () => {
  const str = 'A1'; // Upper A (alpha, byte), 1 (numeric, alpha, byte)
  const version = 1;
  const ecl = 0;
  const strategies = Array.from(allStrategies(str, version, ecl));

  expect(strategies.length).toBe(8);

  const costs = strategies.map(s => s.cost).sort();
  expect(costs).toEqual([24, 28, 37, 38, 38, 39, 39, 40]);

  let minStrat = strategies.reduce((min, s) => s.cost < min.cost ? s : min);
  const minimal = findMinimalSegmentation(str, version);
  expect(minStrat.cost).toBe(minimal.cost);
  expect(minStrat.steps).toEqual(minimal.steps); // Likely ['alpha','alpha']
});