import { expect, test } from "bun:test";
import { findOptimalSegmentation, getNumRawDataModules } from "../src/segments"; // Adjust import path as needed

// Test 1: Simple case with a short string
test('findOptimalSegmentation selects version 1 and high ECL for short string', () => {
  const str = "A";
  const result = findOptimalSegmentation(str, { minVersion: 1, maxVersion: 40, minEcl: 0 });
  expect(result.version).toBe(1);
  expect(result.ecl).toBe(3); // Should maximize ECL since data fits
  expect(result.bitstring).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(1) / 8); // Total codewords for version 1
  expect(result.bitstring.length).toBe(totalCodewords);
});

// Test 2: Respecting minimum ECL with short string
test('findOptimalSegmentation respects minEcl and maximizes ECL', () => {
  const str = "A";
  const result = findOptimalSegmentation(str, { minVersion: 1, maxVersion: 40, minEcl: 1 });
  expect(result.version).toBe(1);
  expect(result.ecl).toBe(3); // Should still maximize to 'high'
  expect(result.bitstring).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(1) / 8);
  expect(result.bitstring.length).toBe(totalCodewords);
});

// Test 3: String requiring a higher version
test('findOptimalSegmentation selects higher version for longer string', () => {
  const str = "A".repeat(30); // 30 alphanumeric chars should exceed version 1 capacity
  const result = findOptimalSegmentation(str, { minVersion: 1, maxVersion: 40, minEcl: 0 });
  expect(result.version).toBeGreaterThan(1); // Should select version 2 or higher
  expect(result.bitstring).toBeInstanceOf(Uint8Array);
  const totalCodewords = Math.floor(getNumRawDataModules(result.version) / 8);
  expect(result.bitstring.length).toBe(totalCodewords);
});

// Test 4: String too long for max version
test('findOptimalSegmentation throws error for data too long', () => {
  const str = "A".repeat(10000); // Far exceeds version 40 capacity
  expect(() => findOptimalSegmentation(str, { minVersion: 1, maxVersion: 40, minEcl: 0 }))
    .toThrow("Data too long");
});