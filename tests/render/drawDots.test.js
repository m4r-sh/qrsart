import { expect, test } from "bun:test";
import { drawDots } from "../../src";

const point = [[0, 0]];

test("drawDots defaults to efficient circle paths", () => {
  const path = drawDots(point);

  expect(path).toContain("a0.35,0.35 0 1 0");
});

test("drawDots supports efficient square paths", () => {
  const path = drawDots(point, { size: 0.7, radius: 0 });

  expect(path).toBe("M-0.35,-0.35h0.7v0.7h-0.7Z");
});

test("drawDots supports rounded square paths between square and circle", () => {
  const path = drawDots(point, { size: 0.7, radius: 0.1 });

  expect(path).toContain("a0.1,0.1 0 0 1");
  expect(path).not.toBe(drawDots(point));
  expect(path).not.toBe(drawDots(point, { size: 0.7, radius: 0 }));
});
