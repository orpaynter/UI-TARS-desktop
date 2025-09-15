# Package Manager Guidelines

This project uses **pnpm** as its primary package manager. Please follow these guidelines to avoid conflicts and ensure consistency.

## Why pnpm?

This project is configured to use pnpm as specified in:
- `package.json` - `"packageManager": "pnpm@9.10.0"`
- `pnpm-workspace.yaml` - Workspace configuration
- `pnpm-lock.yaml` - Lock file for dependencies

## Required Setup

1. **Install pnpm globally:**
   ```bash
   npm install -g pnpm
   ```

2. **Verify installation:**
   ```bash
   pnpm --version
   # Should show 9.10.0 or compatible version
   ```

## Commands to Use

### ✅ DO Use These Commands

```bash
# Install dependencies
pnpm install

# Install with frozen lockfile (CI/production)
pnpm install --frozen-lockfile

# Run scripts
pnpm run <script-name>

# Run scripts in specific workspace
pnpm run --filter <package-name> <script-name>

# Add dependencies
pnpm add <package>
pnpm add -D <package>  # dev dependency
pnpm add -w <package>  # workspace root

# Remove dependencies
pnpm remove <package>
```

### ❌ DON'T Use These Commands

```bash
# Avoid npm commands - they can cause conflicts
npm install
npm run <script>
npm add <package>

# Avoid yarn commands
yarn install
yarn run <script>
```

## Common Tasks

### Development
```bash
# Start development server
pnpm run dev:ui-tars

# Run tests
pnpm run test

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Building
```bash
# Build all packages
pnpm run build

# Build specific package
pnpm run --filter ui-tars-desktop build
```

## Workspace Structure

This is a monorepo with the following structure:
- `apps/` - Main applications
- `packages/` - Shared packages and libraries
- `multimodal/` - Multimodal components

## Troubleshooting

### Error: Command failed with exit code 1
If you encounter npm-related errors:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Clear pnpm store:**
   ```bash
   pnpm store prune
   ```

3. **Remove node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   pnpm install
   ```

4. **Skip problematic downloads (if in sandboxed environment):**
   ```bash
   PUPPETEER_SKIP_DOWNLOAD=true pnpm install
   ```

### Mixed package managers detected
If you accidentally used npm and have conflicts:

1. Remove npm-generated files:
   ```bash
   rm -f package-lock.json
   rm -rf node_modules
   ```

2. Clean and reinstall:
   ```bash
   pnpm install --frozen-lockfile
   ```

## Environment Variables

For CI/production environments, you may need:
```bash
# Skip browser downloads in sandboxed environments
export PUPPETEER_SKIP_DOWNLOAD=true

# Use frozen lockfile for reproducible builds
pnpm install --frozen-lockfile
```

## Known Issues

### Electron-vite Build Errors
If you encounter build errors related to electron-vite (e.g., "Cannot read properties of undefined (reading 'replace')"), this is a known issue unrelated to package management. These errors existed before the npm/pnpm migration.

### Puppeteer Download Failures
In sandboxed environments, puppeteer may fail to download Chrome. Use:
```bash
PUPPETEER_SKIP_DOWNLOAD=true pnpm install
```

## Node.js Version

This project requires Node.js >= 20.x (currently using v20.19.5).
Check your version: `node --version`