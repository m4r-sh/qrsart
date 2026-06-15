import { expect, test } from "bun:test";
import { getNumDataCodewords, getNumRawDataModules } from "../../src";
import { CodewordSequence, optimalStrategy } from "../../src";

// Test 1: Simple case with a short string
test('optimalStrategy selects version 2 and high ECL for short string', () => {
  const str = "A";
  const { version, ecl, strategy } = optimalStrategy(str);
  expect(version).toBe(2);
  expect(ecl).toBe(3); // Should maximize ECL since data fits


  let codewords = new CodewordSequence(str, strategy, version, ecl)
  expect(codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(2) / 8); // Total codewords for version 2
  expect(codewords.length).toBe(totalCodewords);
});

// Test 2: Respecting minimum ECL with short string
test('optimalStrategy respects minEcl and maximizes ECL', () => {
  const str = "A";
  const { version, ecl, strategy } = optimalStrategy(str, { version: [1,40], ecl: [1,3] });
  let codewords = new CodewordSequence(str, strategy, version, ecl)
  expect(version).toBe(1);
  expect(ecl).toBe(3); // Should still maximize to 'high'
  expect(codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(1) / 8);
  expect(codewords.length).toBe(totalCodewords);
});
// Test 3: String requiring a higher version
test('optimalStrategy selects higher version for longer string', () => {
  const str = "A".repeat(30); // 30 alphanumeric chars should exceed version 1 capacity
  const { version, ecl, strategy } = optimalStrategy(str, 1, 40);
  let codewords = new CodewordSequence(str, strategy, version, ecl)
  expect(version).toBeGreaterThan(1); // Should select version 2 or higher
  expect(codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(version) / 8);
  expect(codewords.length).toBe(totalCodewords);
});

// Test 4: String too long for max version
test('optimalStrategy throws error for data too long', () => {
  const str = "A".repeat(10000); // Far exceeds version 40 capacity
  expect(() => optimalStrategy(str))
    .toThrow("Data too long");
});
