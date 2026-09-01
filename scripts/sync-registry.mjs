import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const templatesRoot = path.join(repositoryRoot, "templates");
const canonicalRoot = path.join(templatesRoot, "next-app");
const commonPackage = JSON.parse(
  await readFile(path.join(canonicalRoot, "package.json"), "utf8"),
);
const commonDependencies = { ...commonPackage.dependencies };

delete commonDependencies.next;
delete commonDependencies.react;
delete commonDependencies["react-dom"];

const targets = [
  { name: "vite-app", sourceRoot: "src", css: "src/app.css" },
  { name: "start-app", sourceRoot: "src", css: "src/styles.css" },
  { name: "react-router-app", sourceRoot: "app", css: "app/app.css" },
  { name: "astro-app", sourceRoot: "src", css: "src/app.css" },
  {
    name: "laravel-app",
    sourceRoot: "resources/js/honestui",
    css: "resources/css/honestui.css",
    configCss: "resources/css/app.css",
    aliasPrefix: "@/honestui",
    omitTailwindImports: true,
  },
];

const sourceDirectories = ["components", "hooks", "lib", "styles"];
const snapshot = JSON.parse(
  await readFile(path.join(canonicalRoot, "registry.snapshot.json"), "utf8"),
);

for (const target of targets) {
  const targetRoot = path.join(templatesRoot, target.name);
  const targetSourceRoot = path.join(targetRoot, target.sourceRoot);

  for (const directory of sourceDirectories) {
    const destination = path.join(targetSourceRoot, directory);
    await rm(destination, { force: true, recursive: true });
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(canonicalRoot, directory), destination, {
      force: true,
      recursive: true,
    });
  }

  await cp(
    path.join(repositoryRoot, "shared", "starter-home.tsx"),
    path.join(targetSourceRoot, "components", "starter-home.tsx"),
  );
  if (target.aliasPrefix) {
    await rewriteImports(targetSourceRoot, target.aliasPrefix);
  }

  const fontsDestination = path.join(targetRoot, "public", "fonts");
  await rm(fontsDestination, { force: true, recursive: true });
  await mkdir(path.dirname(fontsDestination), { recursive: true });
  await cp(path.join(canonicalRoot, "public", "fonts"), fontsDestination, {
    force: true,
    recursive: true,
  });

  await mkdir(path.join(targetRoot, "scripts"), { recursive: true });
  await cp(
    path.join(canonicalRoot, "scripts", "verify-registry.mjs"),
    path.join(targetRoot, "scripts", "verify-registry.mjs"),
  );

  const targetSnapshot = {
    ...snapshot,
    filesRoot: target.sourceRoot,
    items: snapshot.items.map((item) => ({
      ...item,
      files: item.files.map((file) => path.posix.join(target.sourceRoot, file)),
    })),
  };
  await writeJson(
    path.join(targetRoot, "registry.snapshot.json"),
    targetSnapshot,
  );

  const css = await readFile(
    path.join(repositoryRoot, "shared", "app.css"),
    "utf8",
  );
  const cssFromTarget = path.relative(
    path.dirname(path.join(targetRoot, target.css)),
    path.join(targetSourceRoot, "styles", "index.css"),
  );
  let targetCss = css.replace(
    '"./styles/index.css"',
    JSON.stringify(normalizeCssPath(cssFromTarget)),
  );
  if (target.omitTailwindImports) {
    targetCss = targetCss
      .replace('@import "tailwindcss";\n', "")
      .replace('@import "tw-animate-css";\n', "");
  }
  await writeFile(path.join(targetRoot, target.css), targetCss);

  const packagePath = path.join(targetRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  packageJson.name = `honestui-${target.name}`;
  packageJson.dependencies = sortObject({
    ...commonDependencies,
    ...packageJson.dependencies,
  });
  packageJson.devDependencies = sortObject({
    "@tailwindcss/vite": "^4.2.2",
    "@types/culori": "^4.0.1",
    tailwindcss: "^4.2.2",
    ...packageJson.devDependencies,
  });
  packageJson.scripts = {
    ...packageJson.scripts,
    "verify:registry": "node scripts/verify-registry.mjs",
  };
  await writeJson(packagePath, packageJson);

  const componentsConfig = {
    $schema: "https://honestui.com/schema.json",
    style: "base-default",
    rsc: false,
    tsx: true,
    tailwind: {
      config: "",
      css: target.configCss ?? target.css,
      baseColor: "neutral",
      cssVariables: true,
      prefix: "",
    },
    iconLibrary: "honestui/icons",
    rtl: false,
    aliases: {
      components: `${target.aliasPrefix ?? "@"}/components`,
      utils: `${target.aliasPrefix ?? "@"}/lib/utils`,
      ui: `${target.aliasPrefix ?? "@"}/components/ui`,
      lib: `${target.aliasPrefix ?? "@"}/lib`,
      hooks: `${target.aliasPrefix ?? "@"}/hooks`,
    },
    menuColor: "default",
    menuAccent: "subtle",
    registries: {},
  };
  await writeJson(path.join(targetRoot, "components.json"), componentsConfig);
}

const nextPackagePath = path.join(canonicalRoot, "package.json");
const nextPackage = JSON.parse(await readFile(nextPackagePath, "utf8"));
nextPackage.name = "honestui-next-app";
await writeJson(nextPackagePath, nextPackage);
await cp(
  path.join(repositoryRoot, "shared", "starter-home.tsx"),
  path.join(canonicalRoot, "components", "starter-home.tsx"),
);

function normalizeCssPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function rewriteImports(directory, aliasPrefix) {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteImports(entryPath, aliasPrefix);
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
    const source = await readFile(entryPath, "utf8");
    const rewritten = source
      .replaceAll('"@/components', `"${aliasPrefix}/components`)
      .replaceAll('"@/hooks', `"${aliasPrefix}/hooks`)
      .replaceAll('"@/lib', `"${aliasPrefix}/lib`)
      .replaceAll("'@/components", `'${aliasPrefix}/components`)
      .replaceAll("'@/hooks", `'${aliasPrefix}/hooks`)
      .replaceAll("'@/lib", `'${aliasPrefix}/lib`);
    if (rewritten !== source) await writeFile(entryPath, rewritten);
  }
}
