import { describe, expect, test, afterAll } from "@jest/globals";
import { extractFilesetFromPath } from "src/cli/pipeline-steps";
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
    expect(result.length).toEqual(1);
    expect(result[0].path).toEqual(
      "test/fixtures/manifest-only-package/Manifest.ocf.json"
    );
  });

  test("should handle a directory with multiple files", () => {
    const result = extractFilesetFromPath(
      fixturePath("ambiguous-manifest-package")
    );

    expect(result.length).toBe(2);
    expect(
      result.find(
        (f) =>
          f.path == fixturePath("ambiguous-manifest-package/Manifest.ocf.json")
      )
    ).not.toBeNull();
    expect(
      result.find(
        (f) =>
          f.path ==
          fixturePath("ambiguous-manifest-package/ManifestClone.ocf.json")
      )
    ).not.toBeNull();

    // ensure that each file in the result set is linked with the correct
    // contents
    result.forEach((file) => {
      expect(file.readAsText()).toEqual(fs.readFileSync(file.path, "utf8"));
    });
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

  test("container relative path matching", () => {
    const fixture = extractFilesetFromPath(
      fixturePath("manifest-only-package")
    );

    expect(fixture[0].isSameAs("Manifest.ocf.json")).toBe(true);
    expect(fixture[0].isSameAs("./Manifest.ocf.json")).toBe(true);
    expect(
      fixture[0].isSameAs("../manifest-only-package/Manifest.ocf.json")
    ).toBe(true);
    expect(
      fixture[0].isSameAs("../ambiguous-manifest-package/Manifest.ocf.json")
    ).toBe(false);
  });

  function fixturePath(fixtureName: string) {
    return `test/fixtures/${fixtureName}`;
  }

  function tempfilePath(pathName: string) {
    return `tmp/${pathName}`;
  }

  afterAll(() => {
    fs.rmSync(emptyDirectoryPath, { recursive: true });
    fs.unlinkSync(exampleFilePath);
  });
});
