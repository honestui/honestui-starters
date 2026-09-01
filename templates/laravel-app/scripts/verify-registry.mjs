import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const snapshotPath = path.join(projectRoot, "registry.snapshot.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const expectedFiles = new Set(
  snapshot.items.flatMap((item) => item.files),
);
const missingFiles = [];

for (const relativePath of expectedFiles) {
  try {
    await access(path.join(projectRoot, relativePath));
  } catch {
    missingFiles.push(relativePath);
  }
}

if (snapshot.items.length !== snapshot.itemCount) {
  throw new Error(
    `Registry snapshot declares ${snapshot.itemCount} items but contains ${snapshot.items.length}.`,
  );
}

if (expectedFiles.size !== snapshot.fileCount) {
  throw new Error(
    `Registry snapshot declares ${snapshot.fileCount} files but contains ${expectedFiles.size} unique targets.`,
  );
}

if (missingFiles.length > 0) {
  throw new Error(
    `Missing ${missingFiles.length} registry files:\n${missingFiles.join("\n")}`,
  );
}

console.log(
  `Verified ${snapshot.itemCount} public registry items across ${snapshot.fileCount} files.`,
);
