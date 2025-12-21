# MCP Server: OrPaynter Claims

MCP server for managing OrPaynter insurance claims.

## Features

- Create new insurance claims
- Check claim status
- Export claim packets (PDF/ZIP)

## Installation

```bash
pnpm install @agent-infra/mcp-server-orpaynter-claims
```

## Usage

### Environment Variables

- `ORPAYNTER_API_BASE` - Base URL for OrPaynter API (optional, uses mock mode if not set)
- `ORPAYNTER_TOKEN` - Authentication token for OrPaynter API (optional)

### As CLI

```bash
mcp-server-orpaynter-claims
```

### As Module

```typescript
import { createServer } from '@agent-infra/mcp-server-orpaynter-claims';

const server = createServer();
// ... use server
```

## Tools

### createClaim

Create a new insurance claim for a project.

**Parameters:**
- `projectId` (string, required) - Project identifier
- `policyNumber` (string, required) - Insurance policy number
- `lossDate` (string, required) - Date of loss (ISO 8601 format)
- `description` (string, optional) - Claim description

### getClaimStatus

Get current status of an insurance claim.

**Parameters:**
- `claimId` (string, required) - Claim identifier

### exportPacket

Export a claim packet as PDF or ZIP.

**Parameters:**
- `claimId` (string, required) - Claim identifier
- `format` (string, required) - Export format ('pdf' or 'zip')

## Demo Mode

When `ORPAYNTER_API_BASE` is not set, the server operates in demo mode with mock responses.
