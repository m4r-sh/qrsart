import { expect, test } from "bun:test";
import { boxPath, createQR, drawSVG } from "../../src";

function linesTag(svg) {
  return svg.match(/<path id="Lines"[^>]+>/)[0];
}

test("drawSVG defaults data lines to filled paths", () => {
  const svg = drawSVG(createQR("Line mode"));
  const lines = linesTag(svg);

  expect(lines).toContain('fill="');
  expect(lines).toContain('stroke="none"');
  expect(lines).not.toContain("stroke-width");
});

test("drawSVG can render data lines as stroked centerlines", () => {
  const svg = drawSVG(createQR("Line mode"), {
    lines: { fill: false, thickness: 0.6 },
  });
  const lines = linesTag(svg);

  expect(lines).toContain('stroke="');
  expect(lines).toContain('fill="none"');
  expect(lines).toContain("stroke-width='0.6'");
});

test("finder and alignment paths use winding direction", () => {
  const svg = drawSVG(createQR("Winding"));

  expect(svg).not.toContain('id="Finders" fill-rule=');
  expect(svg).not.toContain('id="Alignments" fill-rule=');
  expect(svg.match(/<path id="Finders"[^>]+>/)[0]).toContain("v-");
});

test("boxPath can reverse winding direction", () => {
  expect(boxPath(2, 2, 2, 0, { clockwise: false })).toBe("M1,1v2h2v-2Z");
});
