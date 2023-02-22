interface File {
  readonly path: string;
  readonly sizeInBytes: number;
  readonly readAsText: () => string;
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

    return new OCFPackage(files[0]);
  }

  readonly asOfDate: Date;
  readonly generatedAtTimestamp: Date;

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

  private constructor(public readonly manifestFile: File) {
    // We parsed the file once before in `couldBeManifestFile`; we
    // could avoid that double parse
    const parsedManifest = JSON.parse(manifestFile.readAsText());
    this.asOfDate = new Date(parsedManifest.as_of);
    this.generatedAtTimestamp = new Date(parsedManifest.generated_at);
  }
}

export default OCFPackage;
