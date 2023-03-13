interface File {
  readonly path: string;
  readonly isSameAs: (containerRelativePath: string) => boolean;
  readonly sizeInBytes: number;
  readonly readAsText: () => string;
}

interface OCFObject {
  readonly id: string;
  readonly object_type: string; // this is actually an enum that comes from the schema but we'll stick with string for now
}

// This user-defined type guard may seem redundant with the interface
// definition above, but it is what allows us to "know" that
// OCFPackage.*objects() generates only OCFObjects and never anything
// else.
//
// It by definition has to allow the arg to be of type "any" so we
// allow that to bypass the eslint rules here.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOCFObject(arg: any): arg is OCFObject {
  return (
    arg &&
    typeof arg == "object" &&
    arg.id &&
    typeof arg.id == "string" &&
    arg.object_type &&
    typeof arg.object_type == "string"
  );
}

class OCFPackage {
  // This probably isn't the right way to define new error types
  // but it got the job done quickly.
  static NoManifestFound = new Error("No manifest file found");
  static MultipleManifestFilesFound = new Error(
    "Multiple manifest files found"
  );

  public static createFromFileset(files: File[]): OCFPackage {
    const candidateFiles = files
      .filter(this.isDotJson)
      .filter(this.underManifestSizeLimit)
      .filter(this.couldBeManifestFile);

    if (candidateFiles.length == 0) {
      throw this.NoManifestFound;
    }

    if (candidateFiles.length > 1) {
      throw this.MultipleManifestFilesFound;
    }

    return new OCFPackage(candidateFiles[0], files);
  }

  readonly asOfDate: Date;
  readonly generatedAtTimestamp: Date;

  public *objects(): Generator<OCFObject> {
    // first the issuer from the manifest
    const parsedManifest = JSON.parse(this.manifestFile.readAsText());
    if (isOCFObject(parsedManifest.issuer)) {
      yield parsedManifest.issuer;
    } else {
      console.warn("Encountered non-OCF object");
    }

    if ("stakeholders_files" in parsedManifest) {
      for (const eachFile of parsedManifest.stakeholders_files) {
        if ("filepath" in eachFile) {
          // find filepath in full file set and load
          const file = this.allFiles.find((f) =>
            f.isSameAs(eachFile["filepath"])
          );
          if (file) {
            try {
              const parsedFile = JSON.parse(file.readAsText());
              if ("items" in parsedFile) {
                for (const item of parsedFile["items"]) {
                  if (isOCFObject(item)) {
                    yield item;
                  } else {
                    console.warn("Encountered non-OCF object");
                  }
                }
              }
            } catch (e: unknown) {
              // TODO: LOG and skip? Fail?
            }
          }
        }
      }
    }
  }

  private static isDotJson(file: File): boolean {
    return file.path.toLowerCase().endsWith(".json");
  }

  private static underManifestSizeLimit(file: File): boolean {
    return file.sizeInBytes <= 50000;
  }

  private static couldBeManifestFile(file: File): boolean {
    try {
      const parsedManifest = JSON.parse(file.readAsText());
      return parsedManifest.file_type === "OCF_MANIFEST_FILE";
    } catch (e: unknown) {
      // TODO logging might be good
    }
    return false;
  }

  private constructor(
    public readonly manifestFile: File,
    private readonly allFiles: File[]
  ) {
    // We parsed the file once before in `couldBeManifestFile`; we
    // could avoid that double parse
    const parsedManifest = JSON.parse(manifestFile.readAsText());
    this.asOfDate = new Date(parsedManifest.as_of);
    this.generatedAtTimestamp = new Date(parsedManifest.generated_at);
  }
}

export default OCFPackage;
