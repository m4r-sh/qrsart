import { expect, test } from "bun:test";
import { minStrategy } from "../../src";


test("selects the cheapest mode for pure inputs", () => {
  expect(minStrategy("", 1).steps).toEqual([]);
  expect(minStrategy("0123456789", 1).steps).toEqual([["numeric", 10]]);
  expect(minStrategy("ABCDEF", 1).steps).toEqual([["alpha", 6]]);
  expect(minStrategy("wxyz", 1).steps).toEqual(([["byte", 4]]));
  expect(minStrategy("こんにち", 1).steps).toEqual(([["kanji", 4]]));
});

test("calculates expected bit costs for simple segments", () => {
  expect(minStrategy("", 1).cost).toBe(0);
  expect(minStrategy("0123456789", 1).cost).toBe(48);
  expect(minStrategy("ABCDEF", 1).cost).toBe(46);
  expect(minStrategy("wxyz", 1).cost).toBe(44);
  expect(minStrategy("こんにち", 1).cost).toBe(64);
});

test("matches Nayuki breakpoint examples", () => {
  expect(minStrategy("012345A", 1).steps).toEqual(([["alpha", 7]]));
  expect(minStrategy("0123456A", 1).cost).toBe(57);
  expect(minStrategy("01234567A", 1).steps).toEqual(([["numeric", 8], ["alpha", 1]]));
  expect(minStrategy("012a", 1).steps).toEqual(([["byte", 4]]));
  expect(minStrategy("0123a", 1).steps).toEqual(([["numeric", 4], ["byte", 1]]));
  expect(minStrategy("ABCDEa", 1).steps).toEqual(([["byte", 6]]));
  expect(minStrategy("ABCDEFa", 1).steps).toEqual(([["alpha", 6], ["byte", 1]]));
});

test("segments larger mixed inputs from Nayuki's examples", () => {
  expect(
    minStrategy(
      "THE SQUARE ROOT OF 2 IS 1.41421356237309504880168872420969807856967187537694807317667973799",
      1,
    ).steps,
  ).toEqual(([["alpha", 26], ["numeric", 65]]));

  expect(
    minStrategy(
      "Golden ratio φ = 1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374......",
      1,
    ).steps,
  ).toEqual(([["byte", 19], ["numeric", 100], ["alpha", 6]]));
});
