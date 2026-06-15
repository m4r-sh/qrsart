import { expect, test } from "bun:test";
import { supportsKanji } from "../../src";

test("supportsKanji is true in the test environment", () => {
  expect(supportsKanji).toBe(true);
});
