import { expect, test } from "bun:test";
import { standardPenalty, createQR } from "../../src";

test("standardPenalty exposes Leaderboard-compatible scores and penalty cache", () => {
  const qr = createQR({ data: "Penalty shape", mask: 0 });
  const result = standardPenalty(qr.grid);

  expect(typeof result.scores.penalty).toBe("number");
  expect(result.cache.penalty1 + result.cache.penalty2 + result.cache.penalty3 + result.cache.penalty4).toBe(result.scores.penalty);
});

// Test 1: Simple case with a short string
// test('createQR chooses the best mask', () => {
//   let qr = createQR({
//     data: 'Hello, World!!!!'
//   })
//   expect(qr.mask).toBe(3)
//   expect(qr.version).toBe(1)
//   expect(qr.ecl).toBe(0)

// });
