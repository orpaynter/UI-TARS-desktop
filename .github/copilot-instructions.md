# Copilot Instructions for UI-TARS-desktop

**Purpose**: Fast, project-specific guidance so AI agents can build, test, and ship changes in minutes.

## Quick Reference

For immediate help:
- **First time?** → See [Do first (commands)](#do-first-commands)
- **Need to debug?** → See [Debugging](#debugging)
- **Adding dependencies?** → See [Packaging & native deps](#packaging--native-deps)
- **Tests failing?** → See [Testing tips](#testing-tips)
- **Common errors?** → See [Troubleshooting](#troubleshooting)

## Big picture
- pnpm + Turbo monorepo; apps in `apps/`, internal libs in `packages/` and `packages/common/`.
- Main app: `apps/ui-tars` (Electron + Vite + React) with `main`, `preload`, `renderer`. Build via `electron-vite`.
- Packaging: Electron Forge (`forge.config.ts`) with curated native deps; Electron Builder (`electron-builder.yml`) for alt targets.
- Tests: Vitest (unit) and Playwright (e2e). User behavior docs live in `docs/`.

## Do first (commands)

Essential commands to get started:

```bash
# 1. Install dependencies (from repo root)
pnpm i

# 2. Run development mode (opens Electron app)
pnpm dev:ui-tars

# 3. Type-check the code
pnpm --filter ui-tars-desktop typecheck

# 4. Run E2E tests (builds app first, then runs Playwright)
pnpm --filter ui-tars-desktop build:e2e && pnpm --filter ui-tars-desktop test:e2e

# 5. Build production installers (DMG/PKG for macOS, EXE for Windows)
pnpm --filter ui-tars-desktop build
```

**Quick development loop:**
```bash
pnpm dev:ui-tars              # Start dev, make changes, hot reload works
pnpm --filter ui-tars-desktop typecheck  # Verify types
pnpm --filter ui-tars-desktop test       # Run unit tests
```

## Architecture map

**Main entry point**: `apps/ui-tars/src/main/main.ts`
- Manages: window creation, system tray, IPC handlers, UTIO integration, user settings, permissions
- Build configuration: `apps/ui-tars/electron.vite.config.ts`

**Process architecture** (Electron):
- **Main process**: `src/main/` - Node.js backend, system APIs
- **Preload scripts**: `src/preload/` - Secure bridge between main and renderer
- **Renderer process**: `src/renderer/` - React UI (runs in browser context)

**Key directories**:
- `apps/ui-tars/src/main/ipcRoutes/` - IPC endpoint implementations
- `packages/ui-tars/*` - Shared types and contracts (SDK, operators, actions)
- `packages/common/*` - Common utilities and configuration
- `apps/ui-tars/src/renderer/src/polyfills/` - Browser API polyfills (e.g., `crypto.ts`)

**Frontend stack**:
- React 18 with TypeScript
- Tailwind v4 via `@tailwindcss/vite` plugin
- Zustand for state management
- Vite for building renderer process

## Conventions

**Required versions**:
- Node.js: >= 20.x (check with `node --version`)
- Package manager: pnpm@9.10.0 exactly (enforced by `packageManager` field)
  - Never use `npm` or `yarn`
  - If you see npm errors, run: `pnpm store prune && rm -rf node_modules && pnpm i`

**TypeScript setup**:
- Path aliases resolved via `vite-tsconfig-paths` plugin
- Multiple tsconfig files:
  - `tsconfig.node.json` - For main process and Node.js code
  - `tsconfig.web.json` - For renderer process (browser environment)
  - `tsconfig.base.json` - Shared configuration

**Styling**:
- SCSS with modern API: `api: 'modern'` (new Sass syntax)
- Tailwind v4 for utility classes (integrated via Vite plugin)
- CSS modules supported for component-scoped styles

## Packaging & native deps

**When adding dependencies to the main process**, you must update multiple files to ensure proper packaging:

1. **`apps/ui-tars/scripts/getExternalPkgs.ts`**
   - Add package name to the list of external packages
   - This prevents the package from being bundled by Vite

2. **`apps/ui-tars/forge.config.ts`**
   - Add to `keepModules` array if it's a top-level dependency
   - Add to `needSubDependencies` object if its dependencies are also needed
   - Add to `unpack` globs if the package contains native binaries or needs to be unpacked from asar

**Example workflow:**
```typescript
// In getExternalPkgs.ts
export const externalPackages = [
  'electron',
  'sharp',
  'jose',
  'your-new-package',  // Add here
];

// In forge.config.ts
const keepModules = ['sharp', 'jose', 'your-new-package'];
const needSubDependencies = {
  'sharp': ['color', 'detect-libc', 'semver'],
  'your-new-package': ['its-dependency'],
};
```

**Platform-specific signing/notarization**:
- **macOS**: Requires `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` environment variables
  - Notarization happens automatically during `electron-forge make` if env vars are set
  - DMG and PKG makers are configured in `forge.config.ts`
  
- **Windows**: Uses Squirrel.Windows maker
  - Custom `executableName` configured in `forge.config.ts`
  - Auto-update support via `electron-updater`

**Testing native dependencies**:
```bash
# Test packaging locally
pnpm --filter ui-tars-desktop build:e2e

# Verify the packaged app works
# macOS: open out/UI\ TARS-darwin-arm64/UI\ TARS.app
# Windows: out/make/squirrel.windows/x64/UI-TARS-<version> Setup.exe
```

## Secrets & env

**Bytecode protection**: 
- `electron-vite` uses bytecodePlugin to protect sensitive code
- Creates a special `app_private` chunk for secrets
- **DO NOT rename this chunk** - it breaks secret protection

**Environment variables**:
- `UI_TARS_APP_PRIVATE_KEY_BASE64` - Main app private key (base64 encoded)
  - Used for encryption and API authentication
  - Must be set during build for production
  - Keep the protected strings list in sync when adding new secrets

**In development**:
```bash
# Create .env file in apps/ui-tars/ (ignored by git)
UI_TARS_APP_PRIVATE_KEY_BASE64=your_base64_key_here
```

**In CI/CD**:
- Set secrets via your CI platform's secret store
- Never commit keys to the repository
- Example GitHub Actions usage:
  ```yaml
  env:
    UI_TARS_APP_PRIVATE_KEY_BASE64: ${{ secrets.PRIVATE_KEY }}
  ```

## Integration points

**Vision-Language Model (VLM) backends**:
- Users configure OpenAI-compatible endpoints in app Settings UI
- See `docs/setting.md` for configuration details
- **Do not hardcode API endpoints or keys**
- Respect the "Responses API" toggle when present
- Support for multiple providers (OpenAI, Anthropic, custom endpoints)

**Reporting & UTIO (UI-TARS Input/Output)**:
- Optional endpoints for exporting HTML reports and event telemetry
- Configuration in user settings
- Maintain stable POST contracts for client requests
- See implementation in `packages/ui-tars/utio/`

**Operators (GUI automation)**:
- **Computer Operator**: Controls the local machine
  - Uses `@ui-tars/operator-nut-js` package
  - Requires system permissions (accessibility, screen recording)
  
- **Browser Operator**: Controls web browsers
  - Uses `@ui-tars/operator-browser` package
  - Supports Chrome, Edge, Firefox (stable/beta/dev/canary)
  
- Shared contracts in:
  - `packages/ui-tars/*` - Core operator interfaces
  - `packages/common/*` - Shared utilities
  - `docs/sdk.md` - Public SDK documentation (mirror these contracts)

**Action parsing**:
- `@ui-tars/action-parser` - Parses VLM responses into executable actions
- `@ui-tars/shared` - Shared types and utilities

### CI / environment note
- In CI, set VLM endpoints and keys via secure env vars (DO NOT commit keys). Example variables used by the app: `UI_TARS_APP_PRIVATE_KEY_BASE64` and provider-specific `API_KEY`/`API_URL` values. Use your CI secret store and mount them into the build/test jobs.

## Debugging

**Development with DevTools**:
```bash
# Standard development (DevTools closed by default)
pnpm dev:ui-tars

# Debug mode (DevTools open + sourcemaps + remote debugging)
pnpm --filter ui-tars-desktop debug
# OR with watch mode
pnpm --filter ui-tars-desktop debug:w

# From inside apps/ui-tars directory
cd apps/ui-tars
pnpm debug
```

**Remote debugging**:
- Debug port: 9222 (when using `debug` or `debug:w` scripts)
- Chrome DevTools URL: `chrome://inspect`
- VS Code: Attach to port 9222 using launch config

**Environment-specific issues**:

### Headless/Container environments (Linux)
If Electron fails to start with errors about missing libraries:
```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install -y \
  libatk1.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 \
  libx11-6 libxss1 libnss3

# Alpine (CI)
apk add --no-cache \
  gtk+3.0 libxscrnsaver libnotify \
  mesa-gl alsa-lib nss
```

### Common runtime errors

**Missing native libraries** (`libatk-1.0.so.0` not found):
```bash
# Solution: Install system dependencies (see above)
```

**Packaging native modules fails**:
```bash
# Solution: Update packaging configuration
# 1. Add to apps/ui-tars/scripts/getExternalPkgs.ts
# 2. Update keepModules in apps/ui-tars/forge.config.ts
```

**Sharp (image processing) errors**:
```bash
# Rebuild Sharp for current platform
cd apps/ui-tars
pnpm rebuild sharp
```

**Screen capture permissions (macOS)**:
- Error: "Screen recording permission not granted"
- Solution: Grant permissions in System Settings > Privacy & Security > Screen Recording
- Add UI TARS to the allowed applications list

**Browser operator fails to launch**:
- Verify Chrome/Edge/Firefox is installed
- Check browser version compatibility in `packages/ui-tars/operator-browser/`
- Look for browser launch errors in console logs

## Testing tips

**Unit tests (Vitest)**:
```bash
pnpm --filter ui-tars-desktop test        # Run all unit tests
pnpm --filter ui-tars-desktop test:bench  # Run benchmarks
pnpm --filter ui-tars-desktop coverage    # Generate coverage report
```
- Config: `apps/ui-tars/vitest.config.mts`
- Environment: Node.js (not browser)
- TS path aliases supported via `vite-tsconfig-paths`
- Coverage output: `coverage/` directory (gitignored)

**E2E tests (Playwright)**:
```bash
# Full workflow (required for first run or after packaging changes)
pnpm --filter ui-tars-desktop build:e2e   # Build packaged app
pnpm --filter ui-tars-desktop test:e2e    # Run Playwright tests

# Quick iteration (if app is already packaged)
pnpm --filter ui-tars-desktop test:e2e
```
- Config: `apps/ui-tars/playwright.config.ts`
- Tests location: `apps/ui-tars/e2e/`
- Serial execution: `workers: 1` (one test at a time)
- Timeout: 60 seconds per test
- Traces: Captured on first retry for debugging
- Uses `electron-playwright-helpers` for Electron-specific interactions

**Test writing guidelines**:
- Place unit tests next to source files: `*.test.ts` or `*.spec.ts`
- E2E tests focus on user workflows, not implementation details
- Use `test.serial()` in Playwright for tests that must run in order
- Mock external APIs (VLM endpoints) in E2E tests

**Debugging failed tests**:
```bash
# Run specific test file
pnpm --filter ui-tars-desktop test path/to/test.spec.ts

# Run with UI (Playwright)
pnpm --filter ui-tars-desktop test:e2e --ui

# View test traces (after failure)
pnpm exec playwright show-trace test-results/.../trace.zip
```

## Pitfalls to avoid

**Critical rules**:
- ✗ Never mix package managers (npm, yarn, pnpm)
  - ✓ Always use `pnpm` (version 9.10.0)
  - Recovery: `pnpm store prune && rm -rf node_modules && pnpm i`

- ✗ Don't rename the `app_private` chunk
  - This chunk is created by electron-vite's bytecodePlugin for secrets
  - Renaming breaks secret protection
  - Keep protected strings list in sync with environment variables

- ✗ Don't modify macOS screen-capture permission module paths
  - The module is wired via a custom Vite plugin in `electron.vite.config.ts`
  - If changing the resolved id, update packaging configuration in `forge.config.ts`

- ✗ Don't commit API keys or secrets to the repository
  - Use environment variables
  - Use `.env` files locally (gitignored)
  - Use CI secret stores for production builds

- ✗ Don't add dependencies without updating packaging config
  - Main process deps must be in `getExternalPkgs.ts` and `forge.config.ts`
  - Native modules need special handling (see [Packaging & native deps](#packaging--native-deps))

## Troubleshooting

### Package manager issues

**Error: "npm ERR!" or wrong package manager**
```bash
# Solution: Clean and reinstall with pnpm
pnpm store prune
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm i
```

**pnpm store is corrupted**
```bash
pnpm store prune
pnpm install --force
```

**Lock file conflicts after pulling**
```bash
pnpm install --frozen-lockfile=false
```

### Build issues

**TypeScript errors during build**
```bash
# Run typecheck separately to see all errors
pnpm --filter ui-tars-desktop typecheck

# Check both Node and Web tsconfigs
pnpm --filter ui-tars-desktop typecheck:node
pnpm --filter ui-tars-desktop typecheck:web
```

**Vite build fails with "out of memory"**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter ui-tars-desktop build
```

**electron-vite fails to find modules**
- Check path aliases in `apps/ui-tars/electron.vite.config.ts`
- Verify `vite-tsconfig-paths` plugin is configured
- Ensure paths match tsconfig.json

**SCSS compilation fails**
- Check `api: 'modern'` is set in SCSS config
- Verify sass-embedded is installed: `pnpm list sass-embedded`

### Packaging issues

**"Module not found" in packaged app** (works in dev)
- Add missing dependency to `getExternalPkgs.ts`
- Add to `keepModules` in `forge.config.ts`
- If it's a sub-dependency, add to `needSubDependencies`

**Native module fails to load in packaged app**
- Add module pattern to `unpack` globs in `forge.config.ts`
- Example: `unpack: ['**/node_modules/sharp/**/*']`

**macOS app shows "damaged and can't be opened"**
- Sign the app with valid Apple Developer certificate
- Or: Allow unsigned apps: `xattr -cr "UI TARS.app"`
- Check codesign: `codesign -dv --verbose=4 "UI TARS.app"`

**Windows installer won't run**
- Check Squirrel maker configuration in `forge.config.ts`
- Verify `executableName` is set correctly
- Check Windows Defender or antivirus isn't blocking

### IPC issues

**Renderer can't call main process function**
- Check IPC handler is registered in `src/main/ipcRoutes/`
- Verify preload script exposes the API in `src/preload/index.ts`
- Check type definitions in `packages/ui-tars/electron-ipc/`

**IPC handler not found**
- Ensure handler is imported in main process entry point
- Check the channel name matches between preload and main
- Verify contextBridge is properly configured

**Type errors with IPC calls**
- Regenerate types if contracts changed
- Check `@ui-tars/electron-ipc` package is up to date
- Verify both preload and renderer are importing from same contract

### Development workflow issues

**Hot reload not working**
```bash
# Use watch mode for better hot reload
pnpm --filter ui-tars-desktop dev:w
```

**Changes not reflected in Electron app**
- Restart the Electron app (Ctrl+R or Cmd+R in renderer)
- If main process changed, stop and restart `pnpm dev:ui-tars`
- Clear Electron cache: `rm -rf ~/Library/Application\ Support/ui-tars-desktop/` (macOS)

**DevTools won't open**
```bash
# Use debug mode which opens DevTools automatically
pnpm --filter ui-tars-desktop debug
```

**React components not rendering**
- Check browser console for errors (open DevTools)
- Verify imports are correct (case-sensitive on Linux)
- Check Tailwind classes are valid for v4

**State not persisting**
- Check electron-store configuration
- Verify storage path: `~/Library/Application Support/ui-tars-desktop/` (macOS)
- Clear store for testing: Delete config files in storage path

## Key files
- Build/packaging: `apps/ui-tars/electron.vite.config.ts`, `apps/ui-tars/forge.config.ts`, `apps/ui-tars/electron-builder.yml`
- Tests: `apps/ui-tars/vitest.config.mts`, `apps/ui-tars/playwright.config.ts`
- Docs: `docs/quick-start.md`, `docs/setting.md`, `docs/sdk.md`, `docs/preset.md`, `docs/deployment.md`

## Common Development Tasks

**Adding a new IPC handler**:
1. Create handler in `apps/ui-tars/src/main/ipcRoutes/yourHandler.ts`
2. Register in main process entry point
3. Add type definitions to `packages/ui-tars/electron-ipc/`
4. Expose API in `apps/ui-tars/src/preload/index.ts`
5. Use in renderer via the preload API

**Adding a new React component**:
1. Create component in `apps/ui-tars/src/renderer/src/components/`
2. Add Tailwind classes (v4 syntax)
3. Import and use in parent component
4. Add unit tests if logic is complex

**Adding a new operator action**:
1. Define action type in `@ui-tars/action-parser`
2. Implement action handler in operator package
3. Update action contracts in `@ui-tars/shared`
4. Add tests for the new action

**Updating dependencies**:
```bash
# Check for outdated packages
pnpm outdated

# Update specific package
pnpm up <package-name>

# Update all packages (be careful!)
pnpm up -r

# If adding/updating main process deps, remember to update:
# - apps/ui-tars/scripts/getExternalPkgs.ts
# - apps/ui-tars/forge.config.ts
```

**Creating a new internal package**:
```bash
# In packages/ directory
mkdir packages/my-package
cd packages/my-package
pnpm init -y  # or manually create package.json

# Update pnpm-workspace.yaml if needed
# Add to dependencies in consuming packages
```

## Performance Tips

**Build performance**:
- Use `pnpm --filter` to build only what you need
- Enable persistent cache in Turbo (default)
- Use `NODE_OPTIONS="--max-old-space-size=4096"` for large builds

**Runtime performance**:
- Keep main process operations async
- Use web workers for heavy renderer computations
- Minimize IPC calls (batch when possible)
- Profile with Chrome DevTools (renderer) and Node inspector (main)

**Development workflow**:
- Use `debug:w` for watch mode with debugging
- Keep DevTools open to catch errors early
- Use React DevTools for component debugging

## Additional Resources

**Official documentation**:
- Electron: https://www.electronjs.org/docs
- Vite: https://vitejs.dev/guide/
- React: https://react.dev/
- Tailwind CSS v4: https://tailwindcss.com/docs

**Project documentation**:
- Quick Start: `docs/quick-start.md`
- Settings Guide: `docs/setting.md`
- SDK Documentation: `docs/sdk.md`
- Preset Configuration: `docs/preset.md`
- Deployment Guide: `docs/deployment.md`

**Helpful commands reference**:
```bash
# Development
pnpm dev:ui-tars                    # Start dev mode
pnpm --filter ui-tars-desktop debug # Debug mode

# Testing
pnpm --filter ui-tars-desktop test        # Unit tests
pnpm --filter ui-tars-desktop test:e2e    # E2E tests
pnpm --filter ui-tars-desktop coverage    # Coverage report

# Building
pnpm --filter ui-tars-desktop typecheck   # Type check
pnpm --filter ui-tars-desktop build       # Production build
pnpm --filter ui-tars-desktop build:e2e   # E2E build

# Maintenance
pnpm --filter ui-tars-desktop clean       # Clean build artifacts
pnpm store prune                          # Clean pnpm cache
```
