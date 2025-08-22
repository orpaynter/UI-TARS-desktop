# OrPaynter MCP Stubs + First‑Run Wizard + Playwright E2E (Drop‑In Pack)

**Drop these files into your monorepo and run the commands at the bottom.** Paths assume a pnpm workspace with `packages/agent-infra/*` and an Electron/React app under `apps/desktop` (adjust if needed).

---

## 1) `packages/agent-infra/mcp-orpaynter-claims`

**package.json**
```jsonc
{
  "name": "@agent-infra/mcp-orpaynter-claims",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.cjs",
  "types": "dist/index.d.ts",
  "bin": {
    "mcp-orpaynter-claims": "dist/index.cjs"
  },
  "exports": {
    ".": {
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "rslib build",
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@agent-infra/mcp-core": "workspace:*",
    "zod": "^3.23.8",
    "ofetch": "^1.3.4"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.4"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

**src/sdk.ts**
```ts
import { ofetch } from 'ofetch';

export type SdkOpts = { baseUrl: string; token?: string };

export function createClaimsSdk({ baseUrl, token }: SdkOpts) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const http = ofetch.create({ baseURL: baseUrl, headers });

  return {
    async createClaim(input: { projectId: string; policyNumber: string; lossDate: string }) {
      // Replace with your real endpoint
      if (!baseUrl) {
        // Mock fallback
        return { id: 'clm_mock_123', status: 'created', ...input };
      }
      return http('/claims', { method: 'POST', body: input });
    },

    async getClaimStatus(claimId: string) {
      if (!baseUrl) return { id: claimId, status: 'pending_review' };
      return http(`/claims/${claimId}`);
    },

    async exportPacket(claimId: string, format: 'pdf' | 'zip') {
      if (!baseUrl) return { url: `https://example.com/mock/${claimId}.${format}` };
      return http(`/claims/${claimId}/export?format=${format}`);
    },
  };
}
```

**src/index.ts**
```ts
import { z } from 'zod';
import { createClaimsSdk } from './sdk';
// Assumes your monorepo exposes a core MCP helper
import { createMcpServer, runCli } from '@agent-infra/mcp-core';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';

export const server = createMcpServer('orpaynter-claims', ({ secrets }) => {
  const sdk = createClaimsSdk({
    baseUrl: ORPAYNTER_API_BASE,
    token: secrets?.ORPAYNTER_TOKEN,
  });

  return {
    tools: {
      createClaim: {
        description: 'Create a new claim for a project',
        schema: z.object({
          projectId: z.string(),
          policyNumber: z.string(),
          lossDate: z.string(), // ISO date
        }),
        run: async (args: unknown) => {
          const input = (args as any);
          return sdk.createClaim(input);
        },
      },
      getClaimStatus: {
        description: 'Get current status of a claim',
        schema: z.object({ claimId: z.string() }),
        run: async (args: unknown) => sdk.getClaimStatus((args as any).claimId),
      },
      exportPacket: {
        description: 'Export a claim packet as PDF or ZIP',
        schema: z.object({ claimId: z.string(), format: z.enum(['pdf', 'zip']) }),
        run: async (args: unknown) => sdk.exportPacket((args as any).claimId, (args as any).format),
      },
    },
  };
});

// Simple CLI: `mcp-orpaynter-claims` starts the server
runCli(server);
```

---

## 2) `packages/agent-infra/mcp-orpaynter-ai`

**package.json**
```jsonc
{
  "name": "@agent-infra/mcp-orpaynter-ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.cjs",
  "types": "dist/index.d.ts",
  "bin": {
    "mcp-orpaynter-ai": "dist/index.cjs"
  },
  "exports": {
    ".": {
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "rslib build",
    "dev": "tsx watch src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@agent-infra/mcp-core": "workspace:*",
    "zod": "^3.23.8",
    "ofetch": "^1.3.4"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.5.4"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

**src/sdk.ts**
```ts
import { ofetch } from 'ofetch';

export type SdkOpts = { baseUrl: string; token?: string };

export function createAiSdk({ baseUrl, token }: SdkOpts) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (token) headers['authorization'] = `Bearer ${token}`;

  const http = ofetch.create({ baseURL: baseUrl, headers });

  return {
    async analyzeRoofImage(input: { base64Image: string; address?: string }) {
      if (!baseUrl) {
        // Mock analysis
        return {
          severityScore: 0.72,
          damageTypes: [{ type: 'hail', confidence: 0.81 }, { type: 'wind', confidence: 0.59 }],
          notes: 'Mock analysis (no API base configured)'
        };
      }
      return http('/ai/roof/analyze', { method: 'POST', body: input });
    },

    async materialEstimate(input: { severityScore: number; roofAreaSqFt?: number }) {
      if (!baseUrl) {
        const { severityScore } = input;
        const bundles = Math.round(30 + 70 * severityScore);
        return {
          bundles,
          underlaymentRolls: Math.max(1, Math.round(bundles / 10)),
          nailsBoxes: Math.max(1, Math.round(bundles / 8)),
          notes: 'Mock estimate (no API base configured)'
        };
      }
      return http('/ai/roof/materials', { method: 'POST', body: input });
    }
  };
}
```

**src/index.ts**
```ts
import { z } from 'zod';
import { createAiSdk } from './sdk';
import { createMcpServer, runCli } from '@agent-infra/mcp-core';

const ORPAYNTER_API_BASE = process.env.ORPAYNTER_API_BASE || '';

export const server = createMcpServer('orpaynter-ai', ({ secrets }) => {
  const sdk = createAiSdk({
    baseUrl: ORPAYNTER_API_BASE,
    token: secrets?.ORPAYNTER_TOKEN,
  });

  return {
    tools: {
      analyzeRoofImage: {
        description: 'Analyze a roof image and return severity score & damage types',
        schema: z.object({ base64Image: z.string(), address: z.string().optional() }),
        run: async (args: unknown) => sdk.analyzeRoofImage(args as any),
      },
      materialsEstimator: {
        description: 'Estimate material quantities based on severity and optional area',
        schema: z.object({ severityScore: z.number().min(0).max(1), roofAreaSqFt: z.number().optional() }),
        run: async (args: unknown) => sdk.materialEstimate(args as any),
      },
    },
  };
});

runCli(server);
```

---

## 3) Playwright E2E: Photo → Score → Estimate → (Stripe link)

> Put e2e under `packages/e2e` (or your preferred location). This assumes a web UI at `process.env.APP_URL || "http://localhost:3000"`. Adjust selectors to your app.

**packages/e2e/package.json**
```jsonc
{
  "name": "@agent-infra/e2e",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test --reporter=list"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.2"
  }
}
```

**packages/e2e/playwright.config.ts**
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60_000,
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    headless: true,
  },
});
```

**packages/e2e/tests/photo-score-estimate.spec.ts**
```ts
import { test, expect } from '@playwright/test';

// NOTE: Replace data-testid selectors with your real ones.

test('Photo → Score → Estimate (Demo Mode)', async ({ page }) => {
  await page.goto('/');

  // Enable Demo Mode
  await page.getByTestId('demo-mode-toggle').click();

  // Upload a sample photo
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('upload-photo').click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles({ name: 'roof.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) });

  // Analyze image
  await page.getByTestId('analyze-button').click();
  await expect(page.getByTestId('severity-score')).toBeVisible();

  // Generate estimate
  await page.getByTestId('generate-estimate').click();
  await expect(page.getByTestId('estimate-bundles')).toHaveText(/\d+/);

  // Optional: create Stripe link
  const stripeBtn = page.getByTestId('create-deposit-link');
  if (await stripeBtn.isVisible()) {
    await stripeBtn.click();
    await expect(page.getByTestId('deposit-url')).toContainText('http');
  }
});
```

**packages/e2e/.env.e2e.example**
```bash
APP_URL=http://localhost:3000
```

---

## 4) First‑Run Wizard (React, dark theme)

> Place in your desktop/web app, e.g. `apps/desktop/src/components/FirstRunWizard.tsx`. Tailwind classes assume your theme; adjust to taste.

**apps/desktop/src/components/FirstRunWizard.tsx**
```tsx
import React, { useMemo, useState } from 'react';

// OrPaynter Dark Theme Tokens
const colors = {
  bg: '#0D1117',
  bg2: '#161B22',
  accent: '#58A6FF',
  text: '#C9D1D9',
  textMuted: '#8B949E',
  live: '#1F6FEB',
  danger: '#FF6A6A'
};

type Keys = {
  OPENAI_API_KEY?: string;
  STRIPE_KEY?: string;
  SENDGRID_KEY?: string;
  TWILIO_KEY?: string;
  QDRANT_URL?: string;
  QDRANT_KEY?: string;
  OPENWEATHER_KEY?: string;
};

type Props = {
  onComplete: (keys: Keys & { demoMode: boolean }) => void;
  onCancel?: () => void;
  defaultKeys?: Partial<Keys>;
};

const Step = ({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) => (
  <div className="rounded-2xl p-6 shadow-lg" style={{ background: colors.bg2 }}>
    <h3 className="text-xl font-semibold" style={{ color: colors.text }}>{title}</h3>
    {desc && <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>{desc}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

export default function FirstRunWizard({ onComplete, onCancel, defaultKeys }: Props) {
  const [page, setPage] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [keys, setKeys] = useState<Keys>({
    OPENAI_API_KEY: defaultKeys?.OPENAI_API_KEY || '',
    STRIPE_KEY: defaultKeys?.STRIPE_KEY || '',
    SENDGRID_KEY: defaultKeys?.SENDGRID_KEY || '',
    TWILIO_KEY: defaultKeys?.TWILIO_KEY || '',
    QDRANT_URL: defaultKeys?.QDRANT_URL || '',
    QDRANT_KEY: defaultKeys?.QDRANT_KEY || '',
    OPENWEATHER_KEY: defaultKeys?.OPENWEATHER_KEY || ''
  });

  const steps = useMemo(() => [
    {
      title: 'Welcome to OrPaynter',
      desc: 'Let’s wire your desktop command center. You can use Demo Mode to get going instantly.'
    },
    {
      title: 'Sign in / Link Account',
      desc: 'Authenticate with your OrPaynter account.'
    },
    {
      title: 'Core API Keys',
      desc: 'Add your keys now (or later). Demo Mode works without them.'
    },
    {
      title: 'Demo Mode',
      desc: 'Great for investor demos and offline flow testing.'
    },
    {
      title: 'Finish',
      desc: 'You’re ready. We’ll run a 10-second system check.'
    }
  ], []);

  const canNext = useMemo(() => {
    if (page === 2) {
      // No hard validation; allow empty for Demo Mode
      return true;
    }
    return true;
  }, [page]);

  const next = () => setPage((p) => Math.min(p + 1, steps.length - 1));
  const back = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>First‑Run Setup</h2>
          {onCancel && (
            <button className="px-3 py-1 rounded-xl" style={{ background: colors.bg2, color: colors.textMuted }} onClick={onCancel}>Close</button>
          )}
        </div>

        {page === 0 && (
          <Step title={steps[0].title} desc={steps[0].desc}>
            <ul className="list-disc ml-6 text-sm" style={{ color: colors.textMuted }}>
              <li>Run in Demo Mode now and plug in keys later.</li>
              <li>Desktop logs are opt‑in and privacy‑respecting.</li>
              <li>Setup takes ~60 seconds.</li>
            </ul>
          </Step>
        )}

        {page === 1 && (
          <Step title={steps[1].title} desc={steps[1].desc}>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-2xl font-medium shadow"
                style={{ background: colors.live, color: '#fff' }}
                onClick={() => alert('TODO: Wire OAuth/Token modal')}
              >
                Sign in with OrPaynter
              </button>
              <button
                className="px-4 py-2 rounded-2xl font-medium shadow border"
                style={{ borderColor: colors.accent, color: colors.accent }}
                onClick={() => alert('TODO: Paste token flow')}
              >
                Paste API Token
              </button>
            </div>
          </Step>
        )}

        {page === 2 && (
          <Step title={steps[2].title} desc={steps[2].desc}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['OPENAI_API_KEY','OpenAI API Key'],
                  ['STRIPE_KEY','Stripe Secret Key'],
                  ['SENDGRID_KEY','SendGrid API Key'],
                  ['TWILIO_KEY','Twilio Auth Token'],
                  ['QDRANT_URL','Qdrant URL'],
                  ['QDRANT_KEY','Qdrant API Key'],
                  ['OPENWEATHER_KEY','OpenWeather API Key'],
                ] as const
              ).map(([k,label]) => (
                <label key={k} className="block">
                  <span className="text-sm" style={{ color: colors.text }}>{label}</span>
                  <input
                    className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.bg2}` }}
                    type="password"
                    placeholder={k}
                    value={(keys as any)[k] || ''}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [k]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          </Step>
        )}

        {page === 3 && (
          <Step title={steps[3].title} desc={steps[3].desc}>
            <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: colors.bg }}>
              <div>
                <p className="font-medium" style={{ color: colors.text }}>Enable Demo Mode</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Uses mock analysis/estimates from MCP servers.</p>
              </div>
              <button
                data-testid="demo-mode-toggle"
                className="px-4 py-2 rounded-2xl font-medium shadow border"
                style={{ borderColor: colors.accent, color: demoMode ? '#fff' : colors.accent, background: demoMode ? colors.accent : 'transparent' }}
                onClick={() => setDemoMode((v) => !v)}
              >{demoMode ? 'On' : 'Off'}</button>
            </div>
          </Step>
        )}

        {page === 4 && (
          <Step title={steps[4].title} desc={steps[4].desc}>
            <ul className="list-disc ml-6 text-sm" style={{ color: colors.textMuted }}>
              <li>AI analysis reachable: <span className="font-mono">mcp-orpaynter-ai</span></li>
              <li>Claims service reachable: <span className="font-mono">mcp-orpaynter-claims</span></li>
              <li>Weather hook ready (OpenWeather/NOAA)</li>
            </ul>
            <p className="mt-3 text-sm" style={{ color: colors.textMuted }}>You can revisit this wizard anytime in Settings → Setup.</p>
          </Step>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className="h-2 w-8 rounded-full" style={{ background: i <= page ? colors.accent : colors.bg2 }} />
            ))}
          </div>
          <div className="flex gap-2">
            {page > 0 && (
              <button className="px-4 py-2 rounded-xl" style={{ background: colors.bg2, color: colors.text }} onClick={back}>Back</button>
            )}
            {page < steps.length - 1 ? (
              <button
                disabled={!canNext}
                className="px-4 py-2 rounded-xl font-semibold shadow"
                style={{ background: colors.accent, color: '#0D1117', opacity: canNext ? 1 : 0.5 }}
                onClick={next}
              >Next</button>
            ) : (
              <button
                className="px-4 py-2 rounded-xl font-semibold shadow"
                style={{ background: colors.live, color: '#fff' }}
                onClick={() => onComplete({ ...keys, demoMode })}
              >Finish</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5) Root `.env.example` additions

```bash
# OrPaynter services
ORPAYNTER_API_BASE=
# Secrets are injected via your secrets store; exposed here for local dev
ORPAYNTER_TOKEN=

# Third‑party keys (optional for Demo Mode)
OPENAI_API_KEY=
STRIPE_KEY=
SENDGRID_KEY=
TWILIO_KEY=
QDRANT_URL=
QDRANT_KEY=
OPENWEATHER_KEY=
```

---

## 6) Wiring & Commands

1) **Add to workspaces** (if not already): in root `package.json`
```jsonc
{
  "workspaces": [
    "packages/*",
    "packages/agent-infra/*",
    "apps/*"
  ]
}
```

2) **Install & build**
```bash
pnpm -w install
pnpm -r run build
```

3) **Run MCP servers (dev)**
```bash
# Terminal A
ORPAYNTER_API_BASE= http_proxy= HTTPS_PROXY= mcp-orpaynter-ai
# Terminal B
ORPAYNTER_API_BASE= http_proxy= HTTPS_PROXY= mcp-orpaynter-claims
```
> Your desktop app’s MCP client should auto‑discover/connect per your `@agent-infra/mcp-core` bootstrap.

4) **Run E2E**
```bash
# from repo root
pnpm --filter @agent-infra/e2e i
pnpm --filter @agent-infra/e2e test
```

5) **Use the First‑Run Wizard**
- Import `FirstRunWizard` and show it when no local config is present.
- Persist keys to your secure store; pass `{ demoMode, ...keys }` to your MCP client bootstrap.

---

### Notes
- Both MCP servers return **mock responses** when `ORPAYNTER_API_BASE` is empty, so Demo Mode works out‑of‑the‑box.
- Adjust schema names and `@agent-infra/mcp-core` APIs to match your actual core.
- Replace the placeholder OAuth/token dialogs and selectors in the Playwright spec.

