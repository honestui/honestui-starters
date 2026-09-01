import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const templatesRoot = path.join(repositoryRoot, "templates");
const canonicalRoot = path.join(templatesRoot, "next-app");
const commonPackage = await readJson(path.join(canonicalRoot, "package.json"));
const registrySnapshot = await readJson(
  path.join(canonicalRoot, "registry.snapshot.json"),
);

const monorepos = [
  {
    source: "next-app",
    target: "next-monorepo",
    imports: ["app/page.tsx"],
    css: "app/globals.css",
    tsconfig: "tsconfig.json",
  },
  {
    source: "vite-app",
    target: "vite-monorepo",
    imports: ["src/App.tsx"],
    css: "src/app.css",
    tsconfig: "tsconfig.app.json",
  },
  {
    source: "start-app",
    target: "start-monorepo",
    imports: ["src/routes/index.tsx"],
    css: "src/styles.css",
    tsconfig: "tsconfig.json",
  },
  {
    source: "react-router-app",
    target: "react-router-monorepo",
    imports: ["app/routes/home.tsx"],
    css: "app/app.css",
    tsconfig: "tsconfig.json",
  },
  {
    source: "astro-app",
    target: "astro-monorepo",
    imports: ["src/pages/index.astro"],
    css: null,
    tsconfig: "tsconfig.json",
  },
];

for (const monorepo of monorepos) {
  const monorepoRoot = path.join(templatesRoot, monorepo.target);
  const webRoot = path.join(monorepoRoot, "apps", "web");
  const uiRoot = path.join(monorepoRoot, "packages", "ui");

  await rm(monorepoRoot, { force: true, recursive: true });
  await mkdir(path.dirname(webRoot), { recursive: true });
  await cp(path.join(templatesRoot, monorepo.source), webRoot, {
    recursive: true,
    filter: (source) => !isGeneratedPath(source),
  });

  for (const registryPath of [
    "components",
    "hooks",
    "lib",
    "styles",
    "src/components",
    "src/hooks",
    "src/lib",
    "src/styles",
    "app/components",
    "app/hooks",
    "app/lib",
    "app/styles",
    "registry.snapshot.json",
    "scripts/verify-registry.mjs",
  ]) {
    await rm(path.join(webRoot, registryPath), { force: true, recursive: true });
  }

  for (const importPath of monorepo.imports) {
    const filePath = path.join(webRoot, importPath);
    const source = await readFile(filePath, "utf8");
    await writeFile(
      filePath,
      source.replaceAll(
        '"@/components/starter-home"',
        '"@workspace/ui/components/starter-home"',
      ).replaceAll(
        "'@/components/starter-home'",
        "'@workspace/ui/components/starter-home'",
      ),
    );
  }

  if (monorepo.css) {
    await writeFile(
      path.join(webRoot, monorepo.css),
      '@import "@workspace/ui/globals.css";\n',
    );
  } else {
    const astroPagePath = path.join(webRoot, "src/pages/index.astro");
    const astroPage = await readFile(astroPagePath, "utf8");
    await writeFile(
      astroPagePath,
      astroPage.replace('import "../app.css";', 'import "@workspace/ui/globals.css";'),
    );
    await rm(path.join(webRoot, "src/app.css"), { force: true });
  }

  const webPackagePath = path.join(webRoot, "package.json");
  const webPackage = await readJson(webPackagePath);
  webPackage.name = "web";
  webPackage.dependencies = sortObject({
    ...webPackage.dependencies,
    "@workspace/ui": "workspace:*",
  });
  delete webPackage.scripts["verify:registry"];
  webPackage.scripts.verify = webPackage.scripts.verify
    ?.replace(/^pnpm verify:registry && /, "")
    .replace(/^npm run verify:registry && /, "");
  webPackage.scripts = replacePnpmScriptCalls(webPackage.scripts);
  const pnpmConfig = webPackage.pnpm;
  delete webPackage.pnpm;
  await writeJson(webPackagePath, webPackage);
  await rm(path.join(webRoot, "pnpm-workspace.yaml"), { force: true });

  const webTsconfigPath = path.join(webRoot, monorepo.tsconfig);
  const webTsconfig = await readJson(webTsconfigPath);
  webTsconfig.compilerOptions ??= {};
  webTsconfig.compilerOptions.paths ??= {};
  webTsconfig.compilerOptions.paths["@workspace/ui/*"] = [
    "../../packages/ui/src/*",
  ];
  await writeJson(webTsconfigPath, webTsconfig);

  await writeJson(
    path.join(webRoot, "components.json"),
    createComponentsConfig({
      css: monorepo.css ?? "src/pages/index.astro",
      rsc: monorepo.source === "next-app",
      aliasPrefix: "@workspace/ui",
    }),
  );

  if (monorepo.source === "next-app") {
    const configPath = path.join(webRoot, "next.config.ts");
    const nextConfig = await readFile(configPath, "utf8");
    await writeFile(
      configPath,
      nextConfig.replace(
        "const nextConfig: NextConfig = {",
        'const nextConfig: NextConfig = {\n  transpilePackages: ["@workspace/ui"],',
      ).replace(
        'import { dirname } from "node:path";',
        'import { dirname, resolve } from "node:path";',
      ).replace("root: projectRoot,", 'root: resolve(projectRoot, "../.."),'),
    );
  }

  await createUiPackage(uiRoot);
  await createMonorepoRoot(monorepoRoot, monorepo.target, pnpmConfig);
}

async function createUiPackage(uiRoot) {
  await mkdir(path.join(uiRoot, "src"), { recursive: true });
  for (const directory of ["components", "hooks", "lib", "styles"]) {
    await cp(
      path.join(canonicalRoot, directory),
      path.join(uiRoot, "src", directory),
      { force: true, recursive: true },
    );
  }
  await cp(
    path.join(repositoryRoot, "shared", "starter-home.tsx"),
    path.join(uiRoot, "src/components/starter-home.tsx"),
  );
  await rewriteWorkspaceImports(path.join(uiRoot, "src"));

  let css = await readFile(path.join(repositoryRoot, "shared/app.css"), "utf8");
  css = css
    .replace('"./styles/index.css"', '"./styles/index.css"')
    .replace(
      '@import "./styles/index.css";\n',
      '@import "./styles/index.css";\n@source "./components/**/*.{ts,tsx}";\n',
    );
  await writeFile(path.join(uiRoot, "src/globals.css"), css);

  const uiSnapshot = {
    ...registrySnapshot,
    filesRoot: "src",
    items: registrySnapshot.items.map((item) => ({
      ...item,
      files: item.files.map((file) => path.posix.join("src", file)),
    })),
  };
  await writeJson(path.join(uiRoot, "registry.snapshot.json"), uiSnapshot);
  await mkdir(path.join(uiRoot, "scripts"), { recursive: true });
  await cp(
    path.join(canonicalRoot, "scripts/verify-registry.mjs"),
    path.join(uiRoot, "scripts/verify-registry.mjs"),
  );
  await writeJson(
    path.join(uiRoot, "components.json"),
    createComponentsConfig({
      css: "src/globals.css",
      rsc: false,
      aliasPrefix: "@workspace/ui",
    }),
  );

  const dependencies = { ...commonPackage.dependencies };
  delete dependencies.next;
  delete dependencies.react;
  delete dependencies["react-dom"];
  await writeJson(path.join(uiRoot, "package.json"), {
    name: "@workspace/ui",
    version: "0.0.0",
    private: true,
    type: "module",
    exports: {
      "./globals.css": "./src/globals.css",
      "./*": "./src/*",
    },
    scripts: {
      typecheck: "tsc --noEmit",
      "verify:registry": "node scripts/verify-registry.mjs",
      verify: "npm run verify:registry && npm run typecheck",
    },
    dependencies: sortObject(dependencies),
    peerDependencies: {
      react: "^19.2.0",
      "react-dom": "^19.2.0",
    },
    devDependencies: {
      "@types/culori": "^4.0.1",
      "@types/node": "^22.20.0",
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      react: "^19.2.0",
      "react-dom": "^19.2.0",
      tailwindcss: "^4.2.2",
      typescript: "^5.9.3",
    },
  });
  await writeJson(path.join(uiRoot, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      types: ["node"],
      paths: {
        "@workspace/ui/*": ["./src/*"],
      },
    },
    include: ["src/**/*.ts", "src/**/*.tsx"],
  });
}

async function createMonorepoRoot(monorepoRoot, name, pnpmConfig) {
  const rootPackage = {
    name: `honestui-${name}`,
    private: true,
    packageManager: "pnpm@10.33.4",
    scripts: {
      build: "turbo build",
      dev: "turbo dev",
      typecheck: "turbo typecheck",
      verify: "turbo verify",
    },
    devDependencies: {
      turbo: "^2.5.8",
    },
  };
  if (pnpmConfig) rootPackage.pnpm = pnpmConfig;
  await writeJson(path.join(monorepoRoot, "package.json"), rootPackage);
  await writeFile(
    path.join(monorepoRoot, "pnpm-workspace.yaml"),
    'packages:\n  - "apps/*"\n  - "packages/*"\n',
  );
  await writeJson(path.join(monorepoRoot, "turbo.json"), {
    $schema: "https://turbo.build/schema.json",
    tasks: {
      build: { dependsOn: ["^build"], outputs: [".next/**", "dist/**", "build/**"] },
      dev: { cache: false, persistent: true },
      typecheck: { dependsOn: ["^typecheck"] },
      verify: { dependsOn: ["^verify"], cache: false },
    },
  });
  await writeFile(
    path.join(monorepoRoot, ".gitignore"),
    "node_modules\n.next\ndist\nbuild\n.turbo\n*.tsbuildinfo\n",
  );
}

async function rewriteWorkspaceImports(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteWorkspaceImports(entryPath);
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
    const source = await readFile(entryPath, "utf8");
    const rewritten = source
      .replaceAll('"@/components', '"@workspace/ui/components')
      .replaceAll('"@/hooks', '"@workspace/ui/hooks')
      .replaceAll('"@/lib', '"@workspace/ui/lib')
      .replaceAll("'@/components", "'@workspace/ui/components")
      .replaceAll("'@/hooks", "'@workspace/ui/hooks")
      .replaceAll("'@/lib", "'@workspace/ui/lib");
    if (rewritten !== source) await writeFile(entryPath, rewritten);
  }
}

function createComponentsConfig({ css, rsc, aliasPrefix }) {
  return {
    $schema: "https://honestui.com/schema.json",
    style: "base-default",
    rsc,
    tsx: true,
    tailwind: {
      config: "",
      css,
      baseColor: "neutral",
      cssVariables: true,
      prefix: "",
    },
    iconLibrary: "honestui/icons",
    rtl: false,
    aliases: {
      components: `${aliasPrefix}/components`,
      utils: `${aliasPrefix}/lib/utils`,
      ui: `${aliasPrefix}/components/ui`,
      lib: `${aliasPrefix}/lib`,
      hooks: `${aliasPrefix}/hooks`,
    },
    menuColor: "default",
    menuAccent: "subtle",
    registries: {},
  };
}

function isGeneratedPath(source) {
  return [
    "node_modules",
    ".next",
    "dist",
    "build",
    ".astro",
    ".react-router",
    "pnpm-lock.yaml",
    "package-lock.json",
    "tsconfig.tsbuildinfo",
  ].some((segment) => source.split(path.sep).includes(segment));
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function replacePnpmScriptCalls(scripts) {
  return Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => [
      name,
      command.replaceAll("pnpm ", "npm run "),
    ]),
  );
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
