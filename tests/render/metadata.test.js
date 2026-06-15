import { expect, test } from "bun:test";
import { createQR, drawSVG, iterateQRs, urlData } from "../../src";

test("createQR preserves DataType metadata", () => {
  const data = urlData({ url: "https://qrs.art" });
  const qr = createQR(data);

  expect(qr.data).toBe("HTTPS://QRS.ART");
  expect(qr.preview).toBe("qrs.art");
  expect(qr.icon.d.length).toBeGreaterThan(0);
  expect(qr.icon.scale).toBe(1 / 20);
});

test("createQR preserves DataType metadata with an explicit mask", () => {
  const data = urlData({ url: "https://qrs.art" });
  const qr = createQR(data, { mask: 0 });

  expect(qr.mask).toBe(0);
  expect(qr.data).toBe("HTTPS://QRS.ART");
  expect(qr.preview).toBe("qrs.art");
  expect(qr.icon.d.length).toBeGreaterThan(0);
});

test("QR.clone preserves optional renderer metadata", () => {
  const qr = createQR(urlData({ url: "https://qrs.art" }));
  const clone = qr.clone();

  expect(clone.data).toBe(qr.data);
  expect(clone.preview).toBe(qr.preview);
  expect(clone.icon).toEqual(qr.icon);
});

test("iterateQRs preserves DataType metadata", () => {
  const data = urlData({ url: "https://qrs.art" });
  const qr = iterateQRs(data).next().value;

  expect(qr.data).toBe("HTTPS://QRS.ART");
  expect(qr.preview).toBe("qrs.art");
  expect(qr.icon.d.length).toBeGreaterThan(0);
});

test("drawSVG uses QR metadata for accessibility and icon rendering", () => {
  const qr = createQR(urlData({ url: "https://qrs.art" }));
  const svg = drawSVG(qr);

  expect(svg).toContain("<title>QR: qrs.art</title>");
  expect(svg).toContain("<desc>HTTPS://QRS.ART</desc>");
  expect(svg).toContain('id="Icon"');
});

test("drawSVG allows icon: null to suppress QR metadata icons", () => {
  const qr = createQR(urlData({ url: "https://qrs.art" }));
  const svg = drawSVG(qr, { icon: null });

  expect(svg).not.toContain('id="Icon"');
});
