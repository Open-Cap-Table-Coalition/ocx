import { describe, expect, test, afterAll } from "@jest/globals";
import { extractFilesetFromPath } from "../src/cli/pipeline-steps";
import fs from "fs";

describe("extractFilesetFromPath", () => {
  const exampleFilePath = tempfilePath("example.txt");
  const emptyDirectoryPath = tempfilePath("empty-directory");

  test("should return empty array when given an empty directory path", () => {
    fs.mkdirSync(emptyDirectoryPath, { recursive: true });
    const result = extractFilesetFromPath(emptyDirectoryPath);
    expect(result).toEqual([]);
  });

  test("should return a non-empty array when given a non-empty directory path", () => {
    const result = extractFilesetFromPath(fixturePath("manifest-only-package"));
    expect(result.length).toEqual(2);
    expect(result[0].path).toEqual(
      "test/fixtures/manifest-only-package/Manifest.ocf.json"
    );
  });

  test("file contains 'hello, world'", () => {
    const expectedContent = "hello, world";
    fs.writeFileSync(exampleFilePath, expectedContent);
    const result = extractFilesetFromPath(tempfilePath(""));
    expect(result.length).toBeGreaterThan(0);

    const myFile = result.find((r) => r.path === exampleFilePath);
    const actualContent = myFile?.readAsText();
    expect(actualContent).toBe(expectedContent);
  });

  function fixturePath(fixtureName: string) {
    return `test/fixtures/${fixtureName}`;
  }

  function tempfilePath(pathName: string) {
    return `tmp/${pathName}`;
  }

  afterAll(() => {
    fs.rmdirSync(emptyDirectoryPath, { recursive: true });
    fs.unlinkSync(exampleFilePath);
  });
});
