import { expect, test } from "bun:test";
import { minStrategy, optimalStrategy } from "../../src";

test("uses minStrategy for the selected version", () => {
  const data = "Golden ratio φ = 1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374......";
  const result = optimalStrategy(data, { version: [1, 40], ecl: [0, 0] });

  expect(result.version).toBe(4);
  expect(result.ecl).toBe(0);
  expect(result.strategy.steps).toEqual(minStrategy(data, result.version).steps);
  expect(result.strategy.cost).toBe(minStrategy(data, result.version).cost);
});

test("selects the smallest allowed version that fits", () => {
  expect(optimalStrategy("A", { version: [1, 40], ecl: [0, 0] }).version).toBe(1);
  expect(optimalStrategy("A", { version: [5, 10], ecl: [0, 0] }).version).toBe(5);

  const longer = optimalStrategy("A".repeat(30), { version: [1, 40], ecl: [0, 3] });
  expect(longer.version).toBe(2);
  expect(longer.strategy.steps).toEqual([["alpha", 30]]);
});

test("maximizes error correction level within the allowed range", () => {
  expect(optimalStrategy("A", { version: [1, 40], ecl: [1, 3] }).ecl).toBe(3);
  expect(optimalStrategy("A", { version: 1, ecl: 0 }).ecl).toBe(0);
  expect(optimalStrategy("A".repeat(30), { version: [1, 40], ecl: [0, 3] }).ecl).toBe(1);
});

test("throws when data cannot fit in the allowed version range", () => {
  expect(() => optimalStrategy("A".repeat(30), { version: [1, 1], ecl: [0, 0] })).toThrow("Data too long");
  expect(() => optimalStrategy("A".repeat(10000))).toThrow("Data too long");
});
