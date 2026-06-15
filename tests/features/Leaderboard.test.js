import { test, expect } from "bun:test";
import { TopN, BottomN, Leaderboard, QR } from "../../src";

test("Leaderboard tracks min and max metric results", () => {
  const events = [];
  const board = new Leaderboard(qr => ({
    scores: {
      mask: qr.mask,
      inverse: 7 - qr.mask,
    },
    cache: {
      label: `mask-${qr.mask}`,
    },
  }), { capacity: 2 });

  board.listen(event => events.push(event));

  for (const mask of [0, 3, 7]) {
    board.consider(new QR({
      version: 1,
      ecl: 0,
      mask,
      codewords: new Uint8Array(),
    }));
  }

  expect([...board.min("mask")].map(result => result.score)).toEqual([0, 3]);
  expect([...board.max("mask")].map(result => result.score)).toEqual([7, 3]);

  const maskResults = board.results("mask");
  expect(maskResults.min.every(result => result.metric === "mask" && result.direction === "min")).toBe(true);
  expect(maskResults.max.every(result => result.metric === "mask" && result.direction === "max")).toBe(true);
  expect(maskResults.max[0].cache.label).toBe("mask-7");

  expect(Object.keys(board.allResults()).sort()).toEqual(["inverse", "mask"]);
  expect(events.some(event => event.metric === "mask" && event.direction === "max")).toBe(true);
});

test("Leaderboard requires scorer to return scores", () => {
  const board = new Leaderboard(() => ({ cache: {} }));
  const qr = new QR({
    version: 1,
    ecl: 0,
    mask: 0,
    codewords: new Uint8Array(),
  });

  expect(() => board.consider(qr)).toThrow("Leaderboard scorer must return { scores }");
});

test("TopN initialization", () => {
  // Empty heap
  const q1 = new TopN(3);
  expect(q1.size).toBe(0);
  expect(q1.capacity).toBe(3);

  // Initialized with data
  const q2 = new TopN(3, [{ id: 1 }, { id: 2 }], [10, 5]);
  expect(q2.size).toBe(2);
  expect(q2.peekPriority()).toBe(5); // min-heap: root has lowest priority
  expect(q2.peek().id).toBe(2);

  // Error on mismatched arrays
  expect(() => new TopN(3, [1], [1, 2])).toThrow("Objects/priorities mismatch");
});

//
// consider() behavior
//
test("TopN .consider() behavior", () => {
  const q = new TopN(3);

  // Add when not full
  q.consider(10, { id: 1 });
  expect(q.size).toBe(1);
  expect(q.peekPriority()).toBe(10);

  q.consider(5, { id: 2 });
  expect(q.size).toBe(2);
  expect(q.peekPriority()).toBe(5);

  q.consider(15, { id: 3 });
  expect(q.size).toBe(3);
  expect(q.peekPriority()).toBe(5); // [5, 10, 15]

  // Replace smallest when full
  q.consider(12, { id: 4 });
  expect(q.size).toBe(3);
  expect(q.peekPriority()).toBe(10); // [10, 12, 15]
  expect(q.peek().id).toBe(1);

  // Ignore lower score when full
  q.consider(8, { id: 5 });
  expect(q.size).toBe(3);
  expect(q.peekPriority()).toBe(10);
});

//
// drain() (destructive)
//
test("TopN .drain() behavior", () => {
  const q = new TopN(3);

  // Empty heap
  expect([...q.drain()]).toEqual([]);

  // Single item
  q.consider(10, { id: 1 });
  expect([...q.drain()]).toEqual([{ score: 10, object: { id: 1 } }]);
  expect(q.size).toBe(0);

  // Multiple items
  q.consider(5, { id: 2 });
  q.consider(15, { id: 3 });
  q.consider(10, { id: 1 });

  // drain() yields min → max
  const result = [...q.drain()];
  expect(result).toEqual([
    { score: 5,  object: { id: 2 } },
    { score: 10, object: { id: 1 } },
    { score: 15, object: { id: 3 } },
  ]);
  expect(q.size).toBe(0);

  // After replacement
  const q2 = new TopN(3);
  q2.consider(5, { id: 1 });
  q2.consider(10, { id: 2 });
  q2.consider(15, { id: 3 });
  q2.consider(12, { id: 4 }); // replaces 5

  const result2 = [...q2.drain()];
  expect(result2).toEqual([
    { score: 10, object: { id: 2 } },
    { score: 12, object: { id: 4 } },
    { score: 15, object: { id: 3 } },
  ]);
});

//
// Nondestructive iteration
//
test("TopN iteration is nondestructive and sorted descending", () => {
  const q = new TopN(3);
  q.consider(5, { id: 2 });
  q.consider(15, { id: 3 });
  q.consider(10, { id: 1 });

  // iterator yields max → min
  const iter = [...q];
  expect(iter).toEqual([
    { score: 15, object: { id: 3 } },
    { score: 10, object: { id: 1 } },
    { score: 5,  object: { id: 2 } },
  ]);

  // heap is still intact
  expect(q.size).toBe(3);
});

//
// Edge cases
//
test("TopN edge cases", () => {
  const q = new TopN(1);

  // Equal scores → reject new equal
  q.consider(10, { id: 1 });
  q.consider(10, { id: 2 });
  expect(q.size).toBe(1);
  expect(q.peek().id).toBe(1);

  // drain empty
  [...q.drain()];
  expect(q.peek()).toBeNull();

  // NaN scores
  const q2 = new TopN(1);
  expect(() => q2.consider(NaN, { id: 1 })).not.toThrow();
  expect(Number.isNaN(q2.peekPriority())).toBe(true);
});

//
// Larger test
//
test("TopN processes 50 items and returns top 10 correctly", () => {
  const capacity = 10;
  const totalItems = 50;
  const queue = new TopN(capacity);

  // Random data
  const items = Array.from({ length: totalItems }, (_, i) => ({
    id: i + 1,
    score: Math.random() * 100,
  }));

  // Feed heap
  items.forEach(item => queue.consider(item.score, item));

  // Get sorted descending expected
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const expectedTop10 = sorted.slice(0, capacity).map(x => ({
    score: x.score,
    object: x
  }));

  // drain yields min→max, so reverse it
  const results = [...queue.drain()].reverse();

  expect(results).toEqual(expectedTop10);
  expect(results.length).toBe(10);
});

//
// BottomN tests
//
test("BottomN keeps lowest N values correctly", () => {
  const q = new BottomN(3);

  q.consider(10, { id: 1 });
  q.consider(5,  { id: 2 });
  q.consider(15, { id: 3 });

  // lowest three are 5, 10, 15 (full)
  expect(q.peekPriority()).toBe(15); // because it stores -score internally

  // add a number *higher* → ignored
  q.consider(20, { id: 4 });
  expect(q.size).toBe(3);

  // add a *lower* number → accepted
  q.consider(3, { id: 5 });

  // Now lowest 3 are 3, 5, 10
  const result = [...q.drain()];
  expect(result.map(r => r.score)).toEqual([10, 5, 3]);
});


test("TopN and BottomN ordering and score correctness", () => {
  const scores = [5, 1, 10, 7, 3];

  // embed objects to verify stable mapping
  const objs = scores.map((s, i) => ({ id: i + 1, score: s }));

  // --- TOP N TEST ---
  const top = new TopN(5);
  for (const o of objs) {
    top.consider(o.score, o);
  }

  // drain(): expect min→max
  const topDrain = [...top.drain()];
  expect(topDrain.map(x => x.score)).toEqual([1, 3, 5, 7, 10]);

  // heap now empty
  expect(top.size).toBe(0);

  // repopulate
  for (const o of objs) top.consider(o.score, o);

  // iterator(): expect max→min
  const topIter = [...top];
  expect(topIter.map(x => x.score)).toEqual([10, 7, 5, 3, 1]);

  // --- BOTTOM N TEST ---
  const bot = new BottomN(5);
  for (const o of objs) {
    bot.consider(o.score, o);
  }

  // drain(): expect max→min (reverse TopN)
  const botDrain = [...bot.drain()];
  expect(botDrain.map(x => x.score)).toEqual([10, 7, 5, 3, 1]);

  expect(bot.size).toBe(0);

  // repopulate
  for (const o of objs) bot.consider(o.score, o);

  const botIter = [...bot];
  expect(botIter.map(x => x.score)).toEqual([1, 3, 5, 7, 10]);
});
