import * as fs from "fs";
import path from "path";

function adaptEntryToFileInterface(basepath: string, entry: fs.Dirent) {
  const fullpath = path.join(basepath, entry.name);

  return {
    path: fullpath,
    sizeInBytes: fs.statSync(fullpath).size,
    readAsText: () => fs.readFileSync(fullpath, "utf8"),
  };
}

function adaptToFileInterface(basepath: string) {
  return (entry: fs.Dirent) => adaptEntryToFileInterface(basepath, entry);
}

function isFile(entry: fs.Dirent): boolean {
  return entry.isFile();
}

function extractFilesetFromDirectory(path: string) {
  const allEntries = fs.readdirSync(path, { withFileTypes: true });

  return allEntries.filter(isFile).map(adaptToFileInterface(path));
}

export function extractFilesetFromPath(path: string) {
  const fsInfo = fs.statSync(path);

  if (fsInfo.isDirectory()) {
    return extractFilesetFromDirectory(path);
  }

  return []; // no other methods supported yet
}
