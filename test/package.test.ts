import { describe, expect, test } from "@jest/globals";

import OCX from "../src";

describe("ocf-package", () => {
  function mockManifestFile(attrOverrides: object) {
    return {
      path: "manifest.json",
      sizeInBytes: 100, // value doesn't really matter as long as it's below threshold
      readAsText: () => '{ "file_type": "OCF_MANIFEST_FILE" }',
      ...attrOverrides,
    };
  }

  describe("load from fileset", () => {
    test("load fails if fileset is empty", () => {
      const ocfpkg = () => OCX.OCFPackage.createFromFileset([]);

      expect(ocfpkg).toThrow(OCX.OCFPackage.NoManifestFound);
    });

    test("load fails if fileset contains no .json files", () => {
      const ocfpkg = () =>
        OCX.OCFPackage.createFromFileset([
          mockManifestFile({ path: "path/to/garbage.log" }),
        ]);

      expect(ocfpkg).toThrow(OCX.OCFPackage.NoManifestFound);
    });

    test("load fails if fileset contains no .json files smaller than 50000 bytes", () => {
      const ocfpkg = (bytes: number) =>
        OCX.OCFPackage.createFromFileset([
          mockManifestFile({ sizeInBytes: bytes }),
        ]);

      expect(ocfpkg(49999)).toBeInstanceOf(OCX.OCFPackage);
      expect(ocfpkg(50000)).toBeInstanceOf(OCX.OCFPackage);
      expect(() => ocfpkg(50001)).toThrow(OCX.OCFPackage.NoManifestFound);
    });

    test("load fails if no JSON file 'looks like' an OCF manifest", () => {
      const ocfpkg = () =>
        OCX.OCFPackage.createFromFileset([
          mockManifestFile({ readAsText: () => "{ }" }),
        ]);
      expect(ocfpkg).toThrow(OCX.OCFPackage.NoManifestFound);
    });

    test("load fails if multiple possible manifest files are found", () => {
      const ocfpkg = () =>
        OCX.OCFPackage.createFromFileset([
          mockManifestFile({ path: "option1.json" }),
          mockManifestFile({ path: "option2.json" }),
        ]);

      expect(ocfpkg).toThrow(OCX.OCFPackage.MultipleManifestFilesFound);
    });

    test("load succeeds if a valid manifest file is found, even if a malformed JSON file is found first", () => {
      const ocfpkg = () =>
        OCX.OCFPackage.createFromFileset([
          mockManifestFile({}),
          mockManifestFile({
            readAsText: () => {
              "{ ";
            },
          }),
        ]);
      expect(ocfpkg()).toBeInstanceOf(OCX.OCFPackage);
    });
  });
});
