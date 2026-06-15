import { expect, test } from "bun:test";
import { naiveStrategy } from "../../src";

test("uses the single-segment mode selected by Nayuki's step-by-step flow", () => {
  expect(naiveStrategy("", 1).steps).toEqual([["byte", 0]]);
  expect(naiveStrategy("31415926535897932384626433832795028841971693993", 1).steps).toEqual([
    ["numeric", 47],
  ]);
  expect(naiveStrategy("PROJECT NAYUKI", 1).steps).toEqual([["alpha", 14]]);
  expect(naiveStrategy("Hello, world! 123", 1).steps).toEqual([["byte", 17]]);
  expect(naiveStrategy("GIGAZINE", 2).steps).toEqual([["alpha", 8]]);
});

test("calculates QR segment bit costs for the selected single segment", () => {
  expect(naiveStrategy("", 1).cost).toBe(12);
  expect(naiveStrategy("31415926535897932384626433832795028841971693993", 1).cost).toBe(171);
  expect(naiveStrategy("PROJECT NAYUKI", 1).cost).toBe(90);
  expect(naiveStrategy("Hello, world! 123", 1).cost).toBe(148);
  expect(naiveStrategy("GIGAZINE", 2).cost).toBe(57);
});

test("allows explicitly forcing a valid single segment mode", () => {
  expect(naiveStrategy("1234", 1, "numeric").steps).toEqual([["numeric", 4]]);
  expect(naiveStrategy("1234", 1, "numeric").cost).toBe(28);
  expect(naiveStrategy("1234", 1, "alpha").steps).toEqual([["alpha", 4]]);
  expect(naiveStrategy("1234", 1, "alpha").cost).toBe(35);
});

test("throws when forced mode or input text is invalid", () => {
  expect(() => naiveStrategy("A", 1, "numeric")).toThrow("Character cannot be encoded in numeric mode");
  expect(() => naiveStrategy("abc", 1, "alpha")).toThrow("Character cannot be encoded in alpha mode");
  expect(() => naiveStrategy("ok", 1, "made-up")).toThrow("Unknown mode: made-up");
});
