import { expect, test } from "bun:test";
import { Grid, tileClusters } from "../../src";

test("tileClusters biggest_shape is 0 for an empty grid", () => {
  const grid = new Grid(2, 2);
  const result = tileClusters(grid);

  expect(result.scores.num_dots).toBe(0);
  expect(result.scores.num_shapes).toBe(0);
  expect(result.scores.biggest_shape).toBe(0);
});

test("tileClusters biggest_shape is 1 when only isolated tiles exist", () => {
  const grid = new Grid(3, 3);
  grid.set(0, 0, true);
  grid.set(2, 2, true);

  const result = tileClusters(grid);

  expect(result.scores.num_dots).toBe(2);
  expect(result.scores.num_shapes).toBe(0);
  expect(result.scores.biggest_shape).toBe(1);
});
