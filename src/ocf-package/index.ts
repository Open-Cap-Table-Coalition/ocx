interface File {
  path: string;
  sizeInBytes: number;
  readAsText: () => string;
}

class OCFPackage {
  // TODO this probably isn't the right way to do this but it got the job done
  // quickly
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

  private constructor(private manifestFile: File) {}
}

export default OCFPackage;
