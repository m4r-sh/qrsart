import { test, expect } from "bun:test";
import { MinQueue } from "../src/search/MinQueue.js"; // Adjust path based on your file structure

// Helper function to create simple test objects

// Test suite
test("MinQueue initialization", () => {
  // Empty heap
  const q1 = new MinQueue(3);
  expect(q1.size()).toBe(0);
  expect(q1.capacity).toBe(3);

  // Initialized with data
  const q2 = new MinQueue(3, [{id:1}, {id:2}], [10, 5]);
  expect(q2.size()).toBe(2);
  expect(q2.peekPriority()).toBe(5); // Min-heap: smallest score at root
  expect(q2.peek().id).toBe(2);

  // Error on mismatched arrays
  expect(() => new MinQueue(3, [1], [1, 2])).toThrow("Objects/priorities mismatch");
});

test("MinQueue .consider() behavior", () => {
  const q = new MinQueue(3);

  // Add when not full
  q.consider(10, {id:1});
  expect(q.size()).toBe(1);
  expect(q.peekPriority()).toBe(10);

  q.consider(5, {id:2});
  expect(q.size()).toBe(2);
  expect(q.peekPriority()).toBe(5);

  q.consider(15, {id:3});
  expect(q.size()).toBe(3);
  expect(q.peekPriority()).toBe(5); // [5, 10, 15]

  // Replace smallest when full
  q.consider(12, {id:4});
  expect(q.size()).toBe(3);
  expect(q.peekPriority()).toBe(10); // [10, 12, 15]
  expect(q.peek().id).toBe(1);

  // Ignore lower score when full
  q.consider(8, {id:5});
  expect(q.size()).toBe(3);
  expect(q.peekPriority()).toBe(10); // Still [10, 12, 15]
});

test("MinQueue .extractAll() behavior", () => {
  const q = new MinQueue(3);

  // Empty heap
  expect(q.extractAll()).toEqual([]);

  // Single item
  q.consider(10, {id:1});
  expect(q.extractAll()).toEqual([{ score: 10, object: { id: 1 } }]);
  expect(q.size()).toBe(0);

  // Multiple items
  q.consider(5, {id:2});
  q.consider(15, {id:3});
  q.consider(10, {id:1});
  const result = q.extractAll();
  console.log(result)
  expect(result).toEqual([
    { score: 15, object: { id: 3 } },
    { score: 10, object: { id: 1 } },
    { score: 5, object: { id: 2 } },
  ]);
  expect(q.size()).toBe(0);

  // After replacement
  const q2 = new MinQueue(3);
  q2.consider(5, {id:1});
  q2.consider(10, {id:2});
  q2.consider(15, {id:3});
  q2.consider(12, {id:4}); // Replaces 5
  const result2 = q2.extractAll();
  expect(result2).toEqual([
    { score: 15, object: { id: 3 } },
    { score: 12, object: { id: 4 } },
    { score: 10, object: { id: 2 } },
  ]);
});

test("MinQueue edge cases", () => {
  const q = new MinQueue(1);

  // Equal scores
  q.consider(10, {id:1});
  q.consider(10, {id:2}); // Should ignore second 10
  expect(q.size()).toBe(1);
  expect(q.peek().id).toBe(1);

  // Pop from empty
  q.extractAll();
  expect(q.pop()).toBeUndefined();

  // NaN or Infinity scores (should handle gracefully or throw)
  const q2 = new MinQueue(1);
  expect(() => q2.consider(NaN, {id:1})).not.toThrow(); // Should work, but may need explicit check
  expect(q2.peekPriority()).toBe(NaN);
});

test("MinQueue processes 50 items and returns top 10 correctly", () => {
  // Set up the test parameters
  const capacity = 10;       // We want the top 10 items
  const totalItems = 50;     // Total items to process
  const queue = new MinQueue(capacity);

  // Generate 50 objects with random scores between 0 and 100
  const items = Array.from(
    { length: totalItems },
    (_, i) => ({ id: i+1, score: Math.random() * 100 })
  );

  // Add all items to the MinQueue using .consider()
  items.forEach(item => queue.consider(item.score, item));

  // Extract the top 10 items from the queue
  const results = queue.extractAll();

  // For verification, sort the original items by score (descending) and take the top 10
  const sortedItems = [...items].sort((a, b) => b.score - a.score);
  const expectedTop10 = sortedItems
    .slice(0, capacity)
    .map(item => ({ score: item.score, object: item }));

  // Verify the results
  expect(results).toEqual(expectedTop10); // Check that the top 10 match
  expect(results.length).toBe(capacity);  // Confirm we got exactly 10 items
});