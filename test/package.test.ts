import { describe, expect, test } from "@jest/globals";

import { extractFilesetFromPath } from "../src/cli/pipeline-steps";

import OCX from "src";

describe("ocf-package", () => {
  function mockManifestFile(attrOverrides: object) {
    return {
      path: "manifest.json",
      isSameAs: (p: string) => !!p,
      sizeInBytes: 100, // value doesn't really matter as long as it's below threshold
      readAsText: () => '{ "file_type": "OCF_MANIFEST_FILE" }',
      ...attrOverrides,
    };
  }

  describe("loading from fileset", () => {
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
      const ocfpkg = OCX.OCFPackage.createFromFileset([
        mockManifestFile({}),
        mockManifestFile({
          readAsText: () => {
            "{ ";
          },
        }),
      ]);

      expect(ocfpkg).toBeInstanceOf(OCX.OCFPackage);
      expect(ocfpkg.manifestFile.path).toBe(mockManifestFile({}).path);
    });
  });

  describe("manifest data", () => {
    test("timestamp properties", () => {
      const fixture = extractFilesetFromPath(
        fixturePath("manifest-only-package")
      );
      const ocfpkg = OCX.OCFPackage.createFromFileset(fixture);

      expect(ocfpkg.asOfDate).toEqual(new Date("2022-03-22"));
      expect(ocfpkg.generatedAtTimestamp).toEqual(
        new Date("2022-03-22T01:23:45-06:00")
      );
    });
  });

  describe("object enumeration", () => {
    test("issuer is emitted", () => {
      const fixture = extractFilesetFromPath(
        fixturePath("manifest-only-package")
      );
      const ocfpkg = OCX.OCFPackage.createFromFileset(fixture);

      const firstObject = ocfpkg.objects().next().value;
      expect(firstObject?.id).toBe("d3373e0a-4dd9-430f-8a56-3281f2800ede");
      expect(firstObject?.object_type).toBe("ISSUER");
    });

    test("other objects are emitted", () => {
      const fixture = extractFilesetFromPath(fixturePath("example-inc"));
      const ocfpkg = OCX.OCFPackage.createFromFileset(fixture);

      const objectIds = new Map<string, Set<string>>();

      for (const obj of ocfpkg.objects()) {
        const items = objectIds.get(obj.object_type) ?? new Set();
        items.add(obj.id);
        objectIds.set(obj.object_type, items);
      }

      expect((objectIds.get("STAKEHOLDER") ?? new Set()).size).toBe(22);
      expect((objectIds.get("STOCK_CLASS") ?? new Set()).size).toBe(3);
      expect((objectIds.get("STOCK_PLAN") ?? new Set()).size).toBe(1);

      expect((objectIds.get("TX_STOCK_ISSUANCE") ?? new Set()).size).toBe(45);
      expect((objectIds.get("TX_STOCK_ACCEPTANCE") ?? new Set()).size).toBe(2);
      expect((objectIds.get("TX_STOCK_CANCELLATION") ?? new Set()).size).toBe(
        3
      );
      expect((objectIds.get("TX_STOCK_REPURCHASE") ?? new Set()).size).toBe(2);
      expect((objectIds.get("TX_STOCK_TRANSFER") ?? new Set()).size).toBe(3);

      expect(
        (objectIds.get("TX_PLAN_SECURITY_ISSUANCE") ?? new Set()).size
      ).toBe(26);
      expect(
        (objectIds.get("TX_PLAN_SECURITY_ACCEPTANCE") ?? new Set()).size
      ).toBe(3);
      expect(
        (objectIds.get("TX_PLAN_SECURITY_CANCELLATION") ?? new Set()).size
      ).toBe(8);
      expect(
        (objectIds.get("TX_PLAN_SECURITY_EXERCISE") ?? new Set()).size
      ).toBe(7);

      expect((objectIds.get("TX_WARRANT_ISSUANCE") ?? new Set()).size).toBe(2);

      expect((objectIds.get("TX_CONVERTIBLE_ISSUANCE") ?? new Set()).size).toBe(
        10
      );
      expect(
        (objectIds.get("TX_CONVERTIBLE_CONVERSION") ?? new Set()).size
      ).toBe(3);
      expect((objectIds.get("TX_VESTING_EVENT") ?? new Set()).size).toBe(2);
      expect((objectIds.get("TX_VESTING_START") ?? new Set()).size).toBe(28);
    });
  });

  function fixturePath(fixtureName: string) {
    return `test/fixtures/${fixtureName}`;
  }
});
