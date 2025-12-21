# Sync Guide: UI-TARS-desktop → orpaynter-mcp-server

This document outlines how to sync the OrPaynter MCP servers from this repository to the `orpaynter-mcp-server` repository.

## Overview

The following MCP servers have been created in this repository and should be synced to `orpaynter-mcp-server`:

1. **OrPaynter Claims MCP Server** (`@agent-infra/mcp-server-orpaynter-claims`)
2. **OrPaynter AI MCP Server** (`@agent-infra/mcp-server-orpaynter-ai`)

## What to Sync

### 1. OrPaynter Claims MCP Server

**Source Location:**
```
packages/agent-infra/mcp-servers/orpaynter-claims/
```

**Files to Copy:**
- `src/index.ts` - Main server implementation
- `src/server.ts` - Server logic
- `src/sdk.ts` - SDK for OrPaynter Claims API
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `rslib.config.ts` - Build configuration
- `README.md` - Complete documentation

**Features:**
- Create and manage insurance claims
- Query claim status and details
- Export claim packets (PDF/ZIP formats)
- Demo mode for offline testing
- Zod validation for all inputs
- Full TypeScript support

**API Integration:**
- Base URL: `https://api.orpaynter.com` (configurable)
- Authentication: Bearer token via `ORPAYNTER_TOKEN` env var
- Endpoints:
  - `POST /claims` - Create new claim
  - `GET /claims/:id` - Get claim details
  - `GET /claims` - List all claims
  - `POST /claims/:id/export` - Export claim packet

---

### 2. OrPaynter AI MCP Server

**Source Location:**
```
packages/agent-infra/mcp-servers/orpaynter-ai/
```

**Files to Copy:**
- `src/index.ts` - Main server implementation
- `src/server.ts` - Server logic
- `src/sdk.ts` - SDK for OrPaynter AI API
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `rslib.config.ts` - Build configuration
- `README.md` - Complete documentation

**Features:**
- AI-powered roof damage analysis from images
- Material quantity estimation
- Damage severity scoring
- Demo mode for offline testing
- Zod validation for all inputs
- Full TypeScript support

**API Integration:**
- Base URL: `https://api.orpaynter.com` (configurable)
- Authentication: Bearer token via `ORPAYNTER_TOKEN` env var
- Endpoints:
  - `POST /ai/analyze-roof` - Analyze roof damage from image
  - `POST /ai/estimate-materials` - Estimate required materials
  - `POST /ai/calculate-severity` - Calculate damage severity score

---

## Deployment Steps

### Step 1: Prepare the orpaynter-mcp-server Repository

```bash
# Clone the target repository
git clone https://github.com/orpaynter/orpaynter-mcp-server.git
cd orpaynter-mcp-server

# Create a new branch for the sync
git checkout -b feat/add-claims-and-ai-mcp-servers
```

### Step 2: Copy MCP Server Files

```bash
# Copy OrPaynter Claims MCP Server
mkdir -p src/orpaynter-claims
cp -r /path/to/UI-TARS-desktop/packages/agent-infra/mcp-servers/orpaynter-claims/* src/orpaynter-claims/

# Copy OrPaynter AI MCP Server
mkdir -p src/orpaynter-ai
cp -r /path/to/UI-TARS-desktop/packages/agent-infra/mcp-servers/orpaynter-ai/* src/orpaynter-ai/
```

### Step 3: Update Package Configuration

If `orpaynter-mcp-server` is a monorepo, update the root `package.json` to include the new servers:

```json
{
  "workspaces": [
    "src/orpaynter-claims",
    "src/orpaynter-ai"
  ]
}
```

If it's not a monorepo, you may need to:
1. Merge the two servers into a single package, or
2. Create separate repositories for each, or
3. Add them as subdirectories with their own build processes

### Step 4: Install Dependencies

```bash
# Install dependencies for both servers
cd src/orpaynter-claims
pnpm install

cd ../orpaynter-ai
pnpm install
```

### Step 5: Build and Test

```bash
# Build the claims server
cd src/orpaynter-claims
pnpm build

# Build the AI server
cd src/orpaynter-ai
pnpm build

# Test both servers (if you have tests)
pnpm test
```

### Step 6: Update Documentation

Create or update the main README in `orpaynter-mcp-server` to document:

1. **Available Servers:**
   - OrPaynter Claims MCP Server
   - OrPaynter AI MCP Server

2. **Installation Instructions:**
   ```bash
   # Install OrPaynter Claims MCP Server
   npm install @agent-infra/mcp-server-orpaynter-claims
   
   # Install OrPaynter AI MCP Server
   npm install @agent-infra/mcp-server-orpaynter-ai
   ```

3. **Configuration:**
   ```bash
   # Set API credentials
   export ORPAYNTER_API_BASE="https://api.orpaynter.com"
   export ORPAYNTER_TOKEN="your_token_here"
   ```

4. **Usage Examples:**
   See the individual READMEs in each server directory.

### Step 7: Commit and Push

```bash
git add .
git commit -m "feat: add OrPaynter Claims and AI MCP servers

- Add OrPaynter Claims MCP Server for insurance claim management
- Add OrPaynter AI MCP Server for roof damage analysis
- Both servers include demo mode for offline testing
- Full TypeScript support with Zod validation
- Comprehensive documentation and usage examples"

git push origin feat/add-claims-and-ai-mcp-servers
```

### Step 8: Create Pull Request

Create a PR in the `orpaynter-mcp-server` repository with:

**Title:** Add OrPaynter Claims and AI MCP Servers

**Description:**
```markdown
## Summary

Adds two production-ready MCP servers for OrPaynter's roofing platform:

1. **OrPaynter Claims MCP Server** - Insurance claims management
2. **OrPaynter AI MCP Server** - AI-powered roof damage analysis

## Features

### OrPaynter Claims MCP Server
- Create and manage insurance claims
- Query claim status and details
- Export claim packets (PDF/ZIP)
- Demo mode for offline testing

### OrPaynter AI MCP Server
- AI-powered roof damage analysis from images
- Material quantity estimation
- Damage severity scoring
- Demo mode for offline testing

## Technical Details
- Full TypeScript implementation
- Zod validation for all inputs
- Comprehensive documentation
- Build configuration with rslib
- No breaking changes

## Testing
- ✅ Claims server builds successfully
- ✅ AI server builds successfully
- ✅ Demo mode works without API credentials
- ✅ All TypeScript types compile

## Documentation
- Complete READMEs for both servers
- Usage examples included
- API integration guides

## Related PRs
- UI-TARS-desktop: [Link to this PR]
```

---

## Environment Variables

Both servers require the following environment variables:

```bash
# Required for production mode
ORPAYNTER_API_BASE="https://api.orpaynter.com"
ORPAYNTER_TOKEN="your_bearer_token"

# Optional - defaults to production if not set
NODE_ENV="production"
```

For demo mode (no API required), simply don't set the environment variables or set:
```bash
ORPAYNTER_DEMO_MODE="true"
```

---

## Architecture Notes

### Package Naming Convention
Both packages follow the naming convention:
- `@agent-infra/mcp-server-orpaynter-claims`
- `@agent-infra/mcp-server-orpaynter-ai`

If the `orpaynter-mcp-server` repo uses a different scope (e.g., `@orpaynter/`), update the package names accordingly.

### Build System
Both servers use:
- **rslib** for building (dual ESM/CJS output)
- **TypeScript** for type safety
- **Zod** for runtime validation

Ensure the target repository supports these tools or adapt as needed.

### MCP Protocol Version
Both servers implement the Model Context Protocol (MCP) specification. Ensure the target repository is compatible with the same MCP version.

---

## Verification Checklist

After syncing, verify:

- [ ] Both servers build successfully
- [ ] All TypeScript types compile without errors
- [ ] Demo mode works without API credentials
- [ ] Production mode connects to OrPaynter API (with valid token)
- [ ] All tools are properly registered in MCP
- [ ] Documentation is complete and accurate
- [ ] Package.json dependencies are correctly specified
- [ ] Build outputs are in expected locations
- [ ] No secrets or API keys are committed to the repo

---

## Maintenance

### Keeping in Sync

When updates are made to these servers in `UI-TARS-desktop`, they should be synced to `orpaynter-mcp-server`:

1. Identify changed files in `packages/agent-infra/mcp-servers/orpaynter-*`
2. Copy updated files to `orpaynter-mcp-server`
3. Test builds and functionality
4. Create a PR with a clear description of changes
5. Update version numbers following semantic versioning

### Version Management

Both servers should follow semantic versioning:
- **MAJOR**: Breaking API changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

---

## Troubleshooting

### Build Failures

If builds fail after sync:
1. Check that all dependencies are installed: `pnpm install`
2. Verify TypeScript configuration matches
3. Ensure rslib is properly configured
4. Check for missing peer dependencies

### Runtime Errors

If servers fail at runtime:
1. Verify environment variables are set correctly
2. Check API endpoint URLs
3. Validate authentication tokens
4. Review server logs for error details
5. Try demo mode to isolate API issues

### Type Errors

If TypeScript compilation fails:
1. Ensure `@modelcontextprotocol/sdk` is installed
2. Check TypeScript version compatibility
3. Verify all imports are correctly resolved
4. Review tsconfig.json settings

---

## Contact

For questions or issues with syncing, contact:
- Repository maintainer: @orpaynter
- Original implementation: UI-TARS-desktop PR [link]
