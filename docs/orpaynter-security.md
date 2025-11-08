# OrPaynter API Key Security

## Overview

The OrPaynter integration implements secure API key handling to ensure sensitive credentials are never exposed to the client-side renderer process.

## Security Architecture

### Server-Side Storage
All API keys are stored and processed exclusively in the Electron main process:
- `.env` file contains actual API keys (git-ignored)
- `.env.example` provides template with example key formats
- Main process IPC routes handle all API calls requiring authentication

### Client Protection
The renderer process (client) NEVER receives actual API keys:
- Only masked configuration is sent to client (e.g., `hasToken: true/false`)
- API calls are proxied through IPC to main process
- Environment variables are only accessible in main process

## Implementation

### IPC Route Handler (`orpaynter.ts`)
```typescript
// Server-side secure storage
let orpaynerConfig: any = null;

// Returns masked version to client
function getMaskedConfig(config: any) {
  return {
    demoMode: config.demoMode,
    // ... non-sensitive fields
    hasToken: !!config.token,  // Only indicates presence
    hasOpenAIKey: !!config.openaiKey,  // Not the actual key
  };
}

// Secure env vars only accessible in main process
function getSecureEnvVars() {
  return {
    ORPAYNTER_TOKEN: process.env.ORPAYNTER_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // ... other keys
  };
}
```

### Renderer Process
```typescript
// Client can only check if keys exist
const config = await window.electron.orpaynter.getConfig();
console.log(config.hasToken); // true/false
// config.token is undefined - never exposed!
```

## API Key Sources

1. **Production**: Real API keys from `.env` file (git-ignored)
2. **Demo Mode**: No API keys needed, uses mock responses
3. **Configuration**: User-provided keys stored securely in main process

## MCP Server Integration

When starting MCP servers:
1. Secure environment variables are loaded from `.env`
2. Server processes are spawned with these credentials
3. Client receives only success/failure status
4. Actual API keys never leave the main process

## Best Practices

✅ **DO:**
- Keep `.env` file in `.gitignore`
- Use `.env.example` as a template
- Store actual keys in `.env` or secure key management
- Validate API keys server-side before use

❌ **DON'T:**
- Commit `.env` file to git
- Send API keys to renderer process
- Log API keys in console or files
- Share API keys in code or documentation

## Environment Variables

Required variables in `.env`:
```bash
ORPAYNTER_TOKEN=your_actual_token
OPENAI_API_KEY=your_actual_openai_key
STRIPE_KEY=your_actual_stripe_key
# ... other service keys
```

All keys are loaded securely by the main process and never exposed to the renderer.

## Audit Trail

- API key access is isolated to `orpaynter.ts` IPC routes
- All API calls are logged (without exposing keys)
- Client receives only operation results, not credentials
- Keys are only used when starting MCP server processes
