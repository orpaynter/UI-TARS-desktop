# Copilot Instructions for UI-TARS-desktop

Purpose: Help AI coding agents work productively in this monorepo with minimal ramp-up. Keep answers specific to THIS repo.

## Big picture
- This is a pnpm + Turbo monorepo. Root `package.json` exposes shared scripts; apps live under `apps/` and internal packages under `packages/` and `packages/common/`.
- The main app is `apps/ui-tars` (UI-TARS Desktop), an Electron + Vite + React app with three parts: `main` (Electron main process), `preload`, and `renderer` (React UI). Build tool is `electron-vite`.
- Packaging uses Electron Forge (`apps/ui-tars/forge.config.ts`) with custom pruning/copying of native deps, and Electron Builder (`apps/ui-tars/electron-builder.yml`) for alternate targets.
- Tests use Vitest for unit and Playwright for e2e. CI uses Turbo task names like `ui-tars-desktop#test:e2e`.
- Documentation for user workflows is under `docs/` (quick-start, preset, sdk, setting). Treat these as the source of truth for product behavior and integration.

## Core workflows
- Install: use pnpm. From repo root: `pnpm install`.
- Dev UI app: from repo root: `pnpm dev:ui-tars` (runs Turbo task `ui-tars-desktop#dev` mapping to `apps/ui-tars` `dev`). Alternatively in `apps/ui-tars`: `pnpm dev` or `pnpm debug`.
- Typecheck `apps/ui-tars`: `pnpm --filter ui-tars-desktop typecheck` or inside app: `pnpm typecheck` (runs both `tsconfig.node.json` and `tsconfig.web.json`).
- Build distributables: inside `apps/ui-tars`: `pnpm build` (electron-vite build then `electron-forge make`). For a quick renderer-only bundle: `pnpm build:dist`. E2E packaging: `pnpm build:e2e`.
- Run e2e tests: from repo root: `pnpm --filter ui-tars-desktop test:e2e` (uses Playwright, see `apps/ui-tars/playwright.config.ts`). Ensure `build:e2e` completed or let Turbo dependences handle it.
- Unit tests: repo root `pnpm test`, or in app `pnpm test` (Vitest). Coverage: `pnpm coverage`.

## Conventions and patterns
- Node version: `>=20.x`. Package manager: `pnpm@9`. Do not use `npm` or `yarn`.
- Paths and aliases: TS path resolution via `vite-tsconfig-paths`. Renderer has a custom alias for `crypto` to `src/renderer/src/polyfills/crypto.ts`.
- Security: `electron-vite` `bytecodePlugin` creates a separate `app_private` chunk for secrets; do not rename this alias. Private key is injected via env `UI_TARS_APP_PRIVATE_KEY_BASE64` and protected strings.
- Packaging: Forge config aggressively prunes `node_modules` to a curated set. If adding native or external deps for main process, update:
  - `apps/ui-tars/scripts/getExternalPkgs.ts`
  - `keepModules` and `needSubDependencies` in `apps/ui-tars/forge.config.ts`
  - `unpack` glob if the module needs unpacking
- Mac notarization/signing is gated by env vars `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`. Windows uses Squirrel maker and custom `executableName`.
- Tailwind v4 is used in renderer via `@tailwindcss/vite`. Keep styles in the renderer tree; SCSS uses `api: 'modern'`.

## External integration points
- VLM backends are OpenAI-compatible endpoints configured by end users in app Settings (see `docs/setting.md`). Do not hardcode. Respect the Responses API toggle when present.
- Reporting/UTIO: optional endpoints for exporting HTML reports and event telemetry (see `docs/setting.md`). Maintain the POST contracts if changing client requests.
- Operators: The desktop integrates local Computer and Browser operators. Shared contracts live in `packages/ui-tars/*` and `packages/common/*`. The public SDK docs are in `docs/sdk.md` – mirror those contracts when touching operator code.

## Testing and E2E specifics
- Playwright config (`apps/ui-tars/playwright.config.ts`) runs tests from `apps/ui-tars/e2e`, serial worker `workers: 1`, 60s timeout, trace on first retry. If a test needs packaging, use `build:e2e` before `test:e2e`.
- Vitest config (`apps/ui-tars/vitest.config.mts`) is Node environment with TS path plugin targeting `tsconfig.node.json`.

## Common pitfalls
- Mixed package managers: if you see `npm ERR!`, switch to pnpm. Clean with `pnpm store prune` and `rimraf node_modules`.
- Native module paths: mac screen capture permissions module is resolved via a custom Vite plugin in `electron.vite.config.ts`. Do not change the resolved id unless you also update packaging.
- Secrets in chunks: keep the `app_private` chunk name and protect strings array in sync with any new secret env vars.

## File map to explore
- App entry and build
  - `apps/ui-tars/electron.vite.config.ts`
  - `apps/ui-tars/forge.config.ts`
  - `apps/ui-tars/electron-builder.yml`
- Tests
  - `apps/ui-tars/vitest.config.mts`
  - `apps/ui-tars/playwright.config.ts`
- Docs (behavioral source of truth)
  - `docs/quick-start.md`, `docs/setting.md`, `docs/sdk.md`, `docs/preset.md`, `docs/deployment.md`

## Snippets
- Start dev from root:
  ```bash
  pnpm i
  pnpm dev:ui-tars
  ```
- Run e2e for app:
  ```bash
  pnpm --filter ui-tars-desktop build:e2e
  pnpm --filter ui-tars-desktop test:e2e
  ```
- Build installers:
  ```bash
  pnpm --filter ui-tars-desktop build
  ```
