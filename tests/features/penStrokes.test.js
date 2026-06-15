import { expect, test } from "bun:test";
import { Grid, penStrokes } from "../../src";

function lineGrid() {
  const grid = new Grid(3, 1);
  grid.set(0, 0, 1);
  grid.set(1, 0, 1);
  grid.set(2, 0, 1);
  return grid;
}

function strokePath(options) {
  return penStrokes(lineGrid(), options).cache.strokes.join(" ");
}

test("penStrokes defaults to filled paths", () => {
  const path = strokePath();

  expect(path).toContain("a0.35 0.35");
  expect(path).not.toContain("h 2");
});

test("penStrokes can return stroke centerline paths", () => {
  const path = strokePath({ fill: false });

  expect(path).toBe("M 0 0 h 2");
});

test("penStrokes keeps expand_stroke as a fill-mode alias", () => {
  expect(strokePath({ expand_stroke: true })).toBe(strokePath({ fill: true }));
  expect(strokePath({ expand_stroke: false })).toBe(strokePath({ fill: false }));
});

test("penStrokes defaults radius to half of thickness", () => {
  expect(strokePath({ fill: true, thickness: 0.8 })).toBe(
    strokePath({ fill: true, thickness: 0.8, radius: 0.4 }),
  );
});

test("penStrokes radius affects filled output only", () => {
  expect(strokePath({ fill: true, thickness: 0.8, radius: 0 })).not.toBe(
    strokePath({ fill: true, thickness: 0.8, radius: 0.4 }),
  );

  expect(strokePath({ fill: false, thickness: 0.8, radius: 0 })).toBe(
    strokePath({ fill: false, thickness: 0.8, radius: 0.4 }),
  );
});
