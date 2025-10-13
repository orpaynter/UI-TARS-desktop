
# Copilot Instructions for UI-TARS-desktop

Purpose: Fast, project-specific guidance so AI agents can build, test, and ship changes in minutes.

## Big picture
- pnpm + Turbo monorepo; apps in `apps/`, internal libs in `packages/` and `packages/common/`.
- Main app: `apps/ui-tars` (Electron + Vite + React) with `main`, `preload`, `renderer`. Build via `electron-vite`.
- Packaging: Electron Forge (`forge.config.ts`) with curated native deps; Electron Builder (`electron-builder.yml`) for alt targets.
- Tests: Vitest (unit) and Playwright (e2e). User behavior docs live in `docs/`.

## Do first (commands)
```bash
pnpm i                             # install (root)
pnpm dev:ui-tars                   # run dev (root) — Electron app
pnpm --filter ui-tars-desktop typecheck
pnpm --filter ui-tars-desktop build:e2e && pnpm --filter ui-tars-desktop test:e2e
pnpm --filter ui-tars-desktop build  # make installers
```

## Architecture map
- Entry: `apps/ui-tars/src/main/main.ts` (window, tray, IPC, UTIO, settings, permissions). Build config: `electron.vite.config.ts`.
- IPC routes: `apps/ui-tars/src/main/ipcRoutes`, shared contracts in `packages/ui-tars/*`, `packages/common/*`.
- Renderer: React + Tailwind v4 (`@tailwindcss/vite`). Crypto polyfill alias: `src/renderer/src/polyfills/crypto.ts`.

## Conventions
- Node >= 20; use pnpm@9 only.
- TS path resolution via `vite-tsconfig-paths`.
- SCSS uses `api: 'modern'`.

## Packaging & native deps
- If adding main-process deps, also update:
  - `apps/ui-tars/scripts/getExternalPkgs.ts`
  - `keepModules`/`needSubDependencies` in `apps/ui-tars/forge.config.ts`
  - `unpack` globs as needed
- macOS signing/notarization uses `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`. Windows uses Squirrel and custom `executableName`.

## Secrets & env
- `electron-vite` bytecodePlugin creates `app_private` chunk — do not rename.
- Private key via `UI_TARS_APP_PRIVATE_KEY_BASE64`; keep protected strings list in sync.

## Integration points
- VLM backends: OpenAI-compatible endpoints configured in-app (see `docs/setting.md`). Do not hardcode; respect Responses API toggle.
- Reporting/UTIO: optional HTML report + telemetry endpoints; keep POST contracts stable.
- Operators: Local Computer/Browser operators; follow contracts in `packages/ui-tars/*` and `packages/common/*` (see `docs/sdk.md`).

## Testing tips
- Playwright: tests in `apps/ui-tars/e2e`, serial worker, 60s timeout, trace on first retry. Run `build:e2e` before `test:e2e` if packaging is required.
- Vitest: Node env with TS paths; coverage via `pnpm coverage`.

## Pitfalls to avoid
- Don’t mix package managers. If issues: `pnpm store prune` and remove `node_modules`.
- macOS screen-capture permission module is wired via a custom Vite plugin; adjust packaging if its resolved id changes.
- Keep `app_private` chunk name and protect-string settings aligned with any new secret envs.

## Key files
- Build/packaging: `apps/ui-tars/electron.vite.config.ts`, `apps/ui-tars/forge.config.ts`, `apps/ui-tars/electron-builder.yml`
- Tests: `apps/ui-tars/vitest.config.mts`, `apps/ui-tars/playwright.config.ts`
- Docs: `docs/quick-start.md`, `docs/setting.md`, `docs/sdk.md`, `docs/preset.md`, `docs/deployment.md`
