import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const templatesRoot = path.join(repositoryRoot, "templates");
const standalone = [
  "next-app",
  "vite-app",
  "start-app",
  "react-router-app",
  "astro-app",
  "laravel-app",
];
const monorepos = [
  "next-monorepo",
  "vite-monorepo",
  "start-monorepo",
  "react-router-monorepo",
  "astro-monorepo",
];

for (const template of [...standalone, ...monorepos]) {
  await requireFile(path.join(templatesRoot, template, "package.json"));
}

for (const template of standalone) {
  await runRegistryCheck(path.join(templatesRoot, template));
}

for (const template of monorepos) {
  const root = path.join(templatesRoot, template);
  await requireFile(path.join(root, "pnpm-workspace.yaml"));
  await requireFile(path.join(root, "apps/web/package.json"));
  await runRegistryCheck(path.join(root, "packages/ui"));
}

console.log(`Verified ${standalone.length + monorepos.length} HonestUI templates.`);

async function runRegistryCheck(cwd) {
  await run(process.execPath, ["scripts/verify-registry.mjs"], cwd);
}

async function requireFile(filePath) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Required template file is missing: ${path.relative(repositoryRoot, filePath)}`);
  }

  if (filePath.endsWith("package.json")) {
    JSON.parse(await readFile(filePath, "utf8"));
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} failed in ${cwd} (${signal ?? `exit ${code}`})`));
    });
  });
}
