# MCP Server: OrPaynter AI

MCP server for OrPaynter AI-powered roof analysis and material estimation.

## Features

- Roof image analysis with damage detection
- Material quantity estimation
- Severity scoring

## Installation

```bash
pnpm install @agent-infra/mcp-server-orpaynter-ai
```

## Usage

### Environment Variables

- `ORPAYNTER_API_BASE` - Base URL for OrPaynter AI API (optional, uses mock mode if not set)
- `ORPAYNTER_TOKEN` - Authentication token for OrPaynter API (optional)

### As CLI

```bash
mcp-server-orpaynter-ai
```

### As Module

```typescript
import { createServer } from '@agent-infra/mcp-server-orpaynter-ai';

const server = createServer();
// ... use server
```

## Tools

### analyzeRoofImage

Analyze a roof image and return severity score and damage types.

**Parameters:**
- `base64Image` (string, required) - Base64-encoded roof image
- `address` (string, optional) - Property address

**Returns:**
- `severityScore` (number) - Damage severity from 0-1
- `damageTypes` (array) - Array of detected damage types with confidence scores
- `notes` (string) - Analysis notes

### materialEstimate

Estimate material quantities based on severity score.

**Parameters:**
- `severityScore` (number, required) - Severity score from 0-1
- `roofAreaSqFt` (number, optional) - Roof area in square feet

**Returns:**
- `bundles` (number) - Estimated shingle bundles needed
- `underlaymentRolls` (number) - Estimated underlayment rolls
- `nailsBoxes` (number) - Estimated boxes of nails
- `notes` (string) - Estimation notes

## Demo Mode

When `ORPAYNTER_API_BASE` is not set, the server operates in demo mode with mock responses.
