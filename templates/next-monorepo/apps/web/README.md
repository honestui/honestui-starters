# HonestUI Next.js starter

A Next.js starter with the complete public HonestUI registry already installed.

## Included

- 59 interface components and 24 larger product, animation, chart, and shader entries from the public registry
- 104 public registry files plus 2 required support files under `components/`
- HonestUI color, typography, spacing, radius, and effect styles under `styles/`
- Local Love Sans font files under `public/fonts/`
- Dependency versions aligned with the HonestUI repository
- `components.json` configured for future HonestUI additions

`registry.snapshot.json` records the exact 83 public entries used to build this starter. Documentation examples and HonestUI website-only helpers are intentionally excluded.

## Start developing

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify the starter

```bash
npm run verify
```

This checks the registry snapshot, lint, TypeScript, and a production build.

## Where to work

- `app/page.tsx` is the starter page.
- `app/globals.css` connects Tailwind utilities to HonestUI tokens.
- `components/ui/` contains interface and product components.
- `components/animated/` contains animation components.
- `components/shaders/` contains visual shader components.
- `styles/` contains the complete HonestUI visual foundation.

The copied component source belongs to this app. Edit, rename, or remove it as your product needs become clear.
