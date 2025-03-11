import { expect, test } from "bun:test";
import { optimalStrategy, getNumRawDataModules } from "../src/segments"; // Adjust import path as needed

// Test 1: Simple case with a short string
test('optimalStrategy selects version 1 and high ECL for short string', () => {
  const str = "A";
  const result = optimalStrategy(str, { minVersion: 1, maxVersion: 40, minEcl: 0 });
  expect(result.version).toBe(1);
  expect(result.ecl).toBe(3); // Should maximize ECL since data fits
  expect(result.codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(1) / 8); // Total codewords for version 1
  expect(result.codewords.length).toBe(totalCodewords);
});

// Test 2: Respecting minimum ECL with short string
test('optimalStrategy respects minEcl and maximizes ECL', () => {
  const str = "A";
  const result = optimalStrategy(str, { minVersion: 1, maxVersion: 40, minEcl: 1 });
  expect(result.version).toBe(1);
  expect(result.ecl).toBe(3); // Should still maximize to 'high'
  expect(result.codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(1) / 8);
  expect(result.codewords.length).toBe(totalCodewords);
});

// Test 3: String requiring a higher version
test('optimalStrategy selects higher version for longer string', () => {
  const str = "A".repeat(30); // 30 alphanumeric chars should exceed version 1 capacity
  const result = optimalStrategy(str, { minVersion: 1, maxVersion: 40, minEcl: 0 });
  expect(result.version).toBeGreaterThan(1); // Should select version 2 or higher
  expect(result.codewords).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(result.version) / 8);
  expect(result.codewords.length).toBe(totalCodewords);
});

// Test 4: String too long for max version
test('optimalStrategy throws error for data too long', () => {
  const str = "A".repeat(10000); // Far exceeds version 40 capacity
  expect(() => optimalStrategy(str, { minVersion: 1, maxVersion: 40, minEcl: 0 }))
    .toThrow("Data too long");
});