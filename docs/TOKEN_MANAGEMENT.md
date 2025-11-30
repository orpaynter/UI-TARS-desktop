# Token Management Guide

## Overview

This guide provides comprehensive documentation for JWT token management in the OrPaynter platform. It covers token structure, lifecycle, validation, storage, and security best practices.

## JWT Token Structure

### Access Token (Supabase Auth)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aal": "aal1",
  "exp": 1234567890,
  "iat": 1234567890,
  "aud": "authenticated",
  "session_id": "session-uuid"
}
```

### Token Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| `sub` | Subject (User UUID) | `"123e4567-e89b-12d3-a456-426614174000"` |
| `email` | User's email address | `"contractor@example.com"` |
| `role` | Authentication role | `"authenticated"`, `"anon"` |
| `aal` | Authenticator Assurance Level | `"aal1"` (basic), `"aal2"` (MFA) |
| `exp` | Expiration timestamp (Unix) | `1701234567` |
| `iat` | Issued at timestamp (Unix) | `1701230967` |
| `aud` | Audience | `"authenticated"` |
| `session_id` | Session identifier | `"session-uuid"` |

### Custom Claims (OrPaynter Platform)

```json
{
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "plan": "professional",
    "company": "ABC Roofing",
    "phone": "+1-555-0123"
  },
  "orpaynter": {
    "subscription_tier": "premium",
    "features": ["ai_estimator", "damage_detector", "weather_intel"],
    "api_quota": 10000,
    "api_used": 1234
  }
}
```

## Token Lifecycle

### Access Token

- **Duration:** 1 hour (3600 seconds)
- **Purpose:** Short-lived credential for API access
- **Storage:** Memory (preferred) or HttpOnly cookie
- **Renewal:** Automatic via refresh token

### Refresh Token

- **Duration:** 30 days
- **Purpose:** Obtain new access tokens without re-authentication
- **Storage:** HttpOnly, Secure, SameSite=Strict cookie
- **Rotation:** New refresh token issued on each use

### Token Lifecycle Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sign In   │────▶│ Get Tokens  │────▶│ Use Access  │
│             │     │             │     │   Token     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                           ┌───────────────────┘
                           │ Token Expired
                           ▼
                    ┌─────────────┐
                    │   Refresh   │
                    │   Token     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │ New Access│ │New Refresh│ │ Re-login  │
       │   Token   │ │   Token   │ │ Required  │
       └───────────┘ └───────────┘ └───────────┘
```

## Token Validation

### Server-Side Validation

```typescript
import { verifyToken, TokenPayload } from '@orpaynter/connector-supabase';

async function validateRequest(token: string): Promise<TokenPayload> {
  try {
    // Verify token signature and expiration
    const payload = await verifyToken(token, {
      secret: process.env.SUPABASE_JWT_SECRET!,
      audience: 'authenticated',
    });
    
    // Check required claims
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid token claims');
    }
    
    // Check token not revoked
    const isRevoked = await checkTokenRevocation(payload.session_id);
    if (isRevoked) {
      throw new Error('Token has been revoked');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Token validation failed');
  }
}
```

### Client-Side Token Check

```typescript
import { isTokenExpired, getTokenExpiration } from '@orpaynter/connector-supabase';

function checkTokenStatus(token: string): { valid: boolean; expiresIn: number } {
  const expiration = getTokenExpiration(token);
  const now = Date.now() / 1000;
  const expiresIn = expiration - now;
  
  return {
    valid: expiresIn > 0,
    expiresIn: Math.max(0, expiresIn),
  };
}

// Auto-refresh before expiration
function setupAutoRefresh(supabase: SupabaseConnector) {
  setInterval(async () => {
    const session = await supabase.getSession();
    if (session) {
      const status = checkTokenStatus(session.access_token);
      
      // Refresh if less than 5 minutes remaining
      if (status.expiresIn < 300) {
        await supabase.refreshSession();
      }
    }
  }, 60000); // Check every minute
}
```

## Token Storage Best Practices

### Browser Applications

```typescript
// RECOMMENDED: Use Supabase client which handles storage automatically
const supabase = createSupabaseConnector({
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
});

// The client stores tokens in:
// - localStorage (by default)
// - Or custom storage via options
```

### Electron Desktop Applications

```typescript
// Secure storage in Electron main process
import { safeStorage } from 'electron';

class SecureTokenStorage {
  private readonly REFRESH_KEY = 'orpaynter_refresh_token';
  
  async storeRefreshToken(token: string): Promise<void> {
    const encrypted = safeStorage.encryptString(token);
    await fs.writeFile(this.getPath(), encrypted);
  }
  
  async getRefreshToken(): Promise<string | null> {
    try {
      const encrypted = await fs.readFile(this.getPath());
      return safeStorage.decryptString(encrypted);
    } catch {
      return null;
    }
  }
  
  async clearTokens(): Promise<void> {
    await fs.unlink(this.getPath()).catch(() => {});
  }
  
  private getPath(): string {
    return path.join(app.getPath('userData'), this.REFRESH_KEY);
  }
}
```

### Mobile Applications

```typescript
// React Native with secure storage
import * as SecureStore from 'expo-secure-store';

async function storeToken(key: string, token: string): Promise<void> {
  await SecureStore.setItemAsync(key, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getToken(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}
```

## Token Security

### Security Headers

```typescript
// Required headers for token transmission
const securityHeaders = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'X-Request-ID': generateRequestId(),
};

// CORS configuration for API
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
};
```

### Token Revocation

```typescript
// Server-side token revocation
async function revokeAllUserSessions(userId: string): Promise<void> {
  // Add all sessions to revocation list
  await supabase.rpc('revoke_user_sessions', { user_id: userId });
  
  // Log revocation event
  await auditLog.record({
    action: 'sessions_revoked',
    userId,
    timestamp: new Date(),
    reason: 'user_initiated',
  });
}

// Check if token is revoked
async function checkTokenRevocation(sessionId: string): Promise<boolean> {
  const { data } = await supabase
    .from('revoked_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  return !!data;
}
```

### Rate Limiting by Token

```typescript
// Rate limiting based on token/user
import { RateLimiter } from '@orpaynter/rate-limiter';

const limiter = new RateLimiter({
  points: 100,        // 100 requests
  duration: 60,       // per 60 seconds
  keyPrefix: 'api',
});

async function checkRateLimit(token: string): Promise<boolean> {
  const payload = decodeToken(token);
  const key = `user:${payload.sub}`;
  
  try {
    await limiter.consume(key);
    return true;
  } catch {
    return false;
  }
}
```

## Integration Examples

### MCP Server Authentication

```typescript
// MCP server middleware for token validation
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { verifyToken } from '@orpaynter/connector-supabase';

const server = new McpServer({
  name: 'orpaynter-claims',
  version: '1.0.0',
});

// Authentication middleware
async function authenticate(request: any): Promise<TokenPayload> {
  const authHeader = request.headers?.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.slice(7);
  return await verifyToken(token, {
    secret: process.env.SUPABASE_JWT_SECRET!,
  });
}

// Protected tool handler
server.setRequestHandler('tools/call', async (request) => {
  // Validate token
  const user = await authenticate(request);
  
  // Check permissions
  if (!user.orpaynter?.features.includes(request.params.name)) {
    throw new Error('Feature not available in your subscription');
  }
  
  // Process request
  return processToolCall(request, user);
});
```

### API Gateway Integration

```typescript
// API gateway token validation
async function validateApiRequest(req: Request): Promise<Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const payload = await verifyToken(token, {
      secret: process.env.SUPABASE_JWT_SECRET!,
    });
    
    // Add user info to request context
    req.user = payload;
    
    // Continue to handler
    return await handleRequest(req);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Token Expired

**Symptom:** API returns 401 Unauthorized after some time

**Solution:**
```typescript
// Implement automatic token refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

#### 2. Token Not Refreshing

**Symptom:** Refresh token fails with "Invalid refresh token"

**Causes:**
- Refresh token expired (30 days)
- Token was revoked
- Multiple tabs/windows causing race condition

**Solution:**
```typescript
// Centralize token refresh
const refreshLock = new AsyncLock();

async function refreshWithLock(): Promise<Session | null> {
  return refreshLock.acquire('refresh', async () => {
    const session = await supabase.refreshSession();
    return session;
  });
}
```

#### 3. CORS Issues with Token

**Symptom:** "Access-Control-Allow-Origin" errors

**Solution:**
```typescript
// Server-side CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.orpaynter.com',
      'http://localhost:3000',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['X-Request-ID'],
}));
```

#### 4. Token Parsing Fails

**Symptom:** "Invalid token format" error

**Solution:**
```typescript
// Validate token format before parsing
function isValidJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => {
    try {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      return true;
    } catch {
      return false;
    }
  });
}
```

## Security Checklist

- [ ] Access tokens stored in memory (not localStorage for sensitive apps)
- [ ] Refresh tokens in HttpOnly, Secure cookies
- [ ] HTTPS enforced for all token transmission
- [ ] Token expiration validated on every request
- [ ] Rate limiting implemented per user/token
- [ ] Token revocation mechanism in place
- [ ] Audit logging for authentication events
- [ ] MFA enabled for admin accounts
- [ ] CORS properly configured
- [ ] XSS protection headers set

## Related Documentation

- [SOC-2 Access Controls](./soc2/access-controls.md)
- [Supabase Connector](../packages/orpaynter-connectors/supabase/README.md)
- [MCP Server Authentication](./soc2/audit-trails.md)
- [API Security Guide](./soc2/data-flows.md)
