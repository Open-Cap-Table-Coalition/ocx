import { describe, expect, test } from "@jest/globals";
import { extractFilesetFromPath } from "../src/cli/pipeline-steps";
import fs from "fs";

describe("extractFilesetFromPath", () => {
  test("should return empty array when given an empty directory path", () => {
    const path = "./test/fixtures";
    fs.mkdirSync(`${path}/empty-directory`, { recursive: true });
    const result = extractFilesetFromPath(path);
    expect(result).toEqual([]);
  });

  test("should return a non-empty array when given a non-empty directory path", () => {
    const path = "./test/fixtures/manifest-only-package";
    const result = extractFilesetFromPath(path);
    expect(result.length).toBeGreaterThan(0);
  });
});
