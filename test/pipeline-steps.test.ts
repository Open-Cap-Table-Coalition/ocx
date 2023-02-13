import { describe, expect, test, afterAll } from "@jest/globals";
import { extractFilesetFromPath } from "../src/cli/pipeline-steps";
import fs from "fs";

describe("extractFilesetFromPath", () => {
  const path = "./test/fixtures";
  const filename = `${path}/example.txt`;
  test("should return empty array when given an empty directory path", () => {
    fs.mkdirSync(`${path}/empty-directory`, { recursive: true });
    const result = extractFilesetFromPath(path);
    expect(result).toEqual([]);
  });

  test("should return a non-empty array when given a non-empty directory path", () => {
    const path = "./test/fixtures/manifest-only-package";
    const result = extractFilesetFromPath(path);
    expect(result.length).toEqual(2);
    expect(result[0].path).toEqual(
      "test/fixtures/manifest-only-package/Manifest.ocf.json"
    );
  });

  test("file contains 'hello, world'", () => {
    const expectedContent = "hello, world";
    fs.writeFileSync(filename, expectedContent);
    const result = extractFilesetFromPath(path);
    expect(result.length).toBeGreaterThan(0);
    const actualContent = result[0].readAsText();
    expect(actualContent).toBe(expectedContent);
    expect(result[0].path).toEqual("test/fixtures/example.txt");
  });

  afterAll(() => {
    fs.rmdirSync(`${path}/empty-directory`, { recursive: true });
    fs.unlinkSync(filename);
  });
});
