# HonestUI starters

Ready-to-run application templates used by the HonestUI CLI. Every template includes the complete public HonestUI registry, the HonestUI style system, local LoveSans font files, and a small starter screen.

## Create a project

Use the CLI and choose a framework when prompted:

```bash
npx honestui@latest init
```

Or choose one directly:

```bash
npx honestui@latest init --template next --name my-app
npx honestui@latest init --template vite --name my-app
npx honestui@latest init --template start --name my-app
npx honestui@latest init --template react-router --name my-app
npx honestui@latest init --template astro --name my-app
npx honestui@latest init --template laravel --name my-app
```

Add `--monorepo` for the Next.js, Vite, TanStack Start, React Router, or Astro workspace template. Laravel is available as a standalone application.

## Templates

| CLI choice | Application | Monorepo |
| --- | --- | --- |
| `next` | `templates/next-app` | `templates/next-monorepo` |
| `vite` | `templates/vite-app` | `templates/vite-monorepo` |
| `start` | `templates/start-app` | `templates/start-monorepo` |
| `react-router` | `templates/react-router-app` | `templates/react-router-monorepo` |
| `astro` | `templates/astro-app` | `templates/astro-monorepo` |
| `laravel` | `templates/laravel-app` | — |

The monorepos use pnpm workspaces and Turborepo. Their web application lives in `apps/web`, and the full HonestUI registry lives in `packages/ui`.

## Work on a template directly

Each JavaScript template supports the usual install and development commands:

```bash
cd templates/vite-app
pnpm install
pnpm dev
```

Laravel follows the official Laravel starter workflow:

```bash
cd templates/laravel-app
composer run setup
composer run dev
```

Node.js 22 is used in CI. Laravel requires PHP 8.3 or newer and Composer.

## Maintain the collection

The Next.js application is the canonical source for registry code. After updating it, synchronize the other standalone applications and regenerate the monorepos:

```bash
npm run sync:registry
npm run generate:monorepos
npm run verify
```

`registry.snapshot.json` records the registry items and files expected in each template. The verification command checks that all CLI targets exist and that none of their HonestUI files have drifted.

## License

MIT
