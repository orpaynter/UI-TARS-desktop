# Access Controls - SOC 2 Documentation

## Overview

This document describes the access control mechanisms, authentication systems, and authorization policies implemented in the OrPaynter platform.

## Authentication Architecture

### Primary Authentication (Supabase Auth)

**Provider:** Supabase Authentication
**Methods Supported:**
- Email + Password
- Magic Link (passwordless)
- OAuth 2.0 (Google, GitHub)
- SAML 2.0 (Enterprise)

**Security Features:**
- Password complexity requirements (min 8 chars, mixed case, numbers)
- Account lockout after 5 failed attempts (15-minute lockout)
- Multi-factor authentication (MFA) support
- Session management with JWT tokens
- Automatic session expiration (1 hour)

### Token Management

**JWT Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aal": "aal1",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Token Lifecycle:**
- **Access Token:** 1 hour expiration
- **Refresh Token:** 30 days expiration
- **Storage:** HttpOnly, Secure, SameSite cookies
- **Transmission:** Authorization header (Bearer token)
- **Rotation:** Automatic on refresh

### API Authentication

**MCP Server Authentication:**
- API key authentication (development)
- JWT token authentication (production)
- Rate limiting: 100 requests/minute per API key
- IP whitelisting for sensitive operations

**API Key Management:**
- Generated via secure random (256-bit)
- Hashed before storage (bcrypt, cost factor 12)
- Prefix notation for easy identification
- Automatic rotation schedule (90 days)
- Immediate revocation capability

## Authorization Model

### Role-Based Access Control (RBAC)

**Roles:**

1. **Anonymous**
   - Read public content
   - Access marketing pages
   - No data persistence

2. **Authenticated User**
   - Access basic features
   - Upload images for analysis
   - View own data
   - Update profile
   - Delete account

3. **Premium User**
   - All Authenticated User permissions
   - Advanced analytics
   - Bulk operations
   - Export functionality
   - Priority support

4. **Admin**
   - All Premium User permissions
   - User management
   - System configuration
   - Access audit logs
   - View aggregated analytics

5. **Super Admin**
   - All Admin permissions
   - Role assignment
   - Database access
   - Security configuration
   - Backup/restore operations

### Permission Matrix

| Resource | Anonymous | User | Premium | Admin | Super Admin |
|----------|-----------|------|---------|-------|-------------|
| Public Pages | Read | Read | Read | Read | Read |
| User Profile | - | Read/Write (own) | Read/Write (own) | Read (all) | Read/Write (all) |
| AI Analysis | - | Create (own) | Create/Bulk (own) | Read (all) | Read/Write (all) |
| Analytics | - | Read (own) | Read (own) | Read (all) | Read/Write (all) |
| Claims | - | CRUD (own) | CRUD (own) | Read (all) | CRUD (all) |
| System Config | - | - | - | Read | Read/Write |
| Audit Logs | - | - | - | Read | Read |
| User Management | - | - | - | Read/Write | Read/Write |
| Backups | - | - | - | - | Read/Write |

### Row-Level Security (RLS)

Implemented via Supabase PostgreSQL policies:

**Users Table:**
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

**Claims Table:**
```sql
-- Users can only see their own claims
CREATE POLICY "Users can view own claims"
  ON claims FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all claims
CREATE POLICY "Admins can view all claims"
  ON claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

**Analysis Results Table:**
```sql
-- Users can only access their own analysis results
CREATE POLICY "Users can view own analysis"
  ON analysis_results FOR SELECT
  USING (auth.uid() = user_id);

-- Automatic data ownership
CREATE POLICY "Set owner on insert"
  ON analysis_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Access Control Implementation

### Application Level

**Desktop Application (Electron):**
```typescript
// Permission check before sensitive operation
async function deleteUserData() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!hasPermission(user, 'delete:own_data')) {
    throw new Error('Insufficient permissions');
  }
  
  // Log access attempt
  await auditLog.record({
    user: user.id,
    action: 'delete_user_data',
    timestamp: new Date(),
  });
  
  // Proceed with deletion
  await performDeletion(user.id);
}
```

**API Level (MCP Server):**
```typescript
// Middleware for authentication
async function authenticateRequest(req) {
  const token = extractToken(req);
  
  if (!token) {
    throw new Error('Missing authentication token');
  }
  
  const payload = await verifyToken(token);
  
  if (isExpired(payload)) {
    throw new Error('Token expired');
  }
  
  return payload;
}

// Middleware for authorization
async function authorizeRequest(req, requiredPermission) {
  const user = await authenticateRequest(req);
  
  if (!hasPermission(user, requiredPermission)) {
    await auditLog.record({
      user: user.id,
      action: 'unauthorized_access_attempt',
      resource: req.path,
      permission: requiredPermission,
    });
    
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
```

## Password Policy

### Requirements

- **Minimum Length:** 8 characters
- **Complexity:** 
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **History:** Cannot reuse last 5 passwords
- **Expiration:** No forced expiration (NIST guidelines)
- **Common Passwords:** Blocked (list of 10,000+ common passwords)

### Password Reset

**Process:**
1. User requests password reset
2. Reset link sent to registered email
3. Link expires in 1 hour
4. Link is single-use only
5. New password must meet complexity requirements
6. All existing sessions invalidated
7. User notified of password change

**Rate Limiting:**
- Maximum 3 reset requests per hour per email
- Maximum 10 reset requests per hour per IP

## Multi-Factor Authentication (MFA)

### Supported Methods

1. **TOTP (Time-based One-Time Password)**
   - Standard: RFC 6238
   - Apps: Google Authenticator, Authy, 1Password
   - Code validity: 30 seconds
   - Recovery codes: 10 single-use codes

2. **SMS (Text Message)**
   - Backup method only
   - Rate limited: 3 codes per hour
   - Code expiration: 10 minutes

### MFA Enrollment

**Enforcement:**
- Optional for standard users
- Required for Admin roles
- Required for users with payment methods
- Required for API key access

**Recovery:**
- 10 single-use recovery codes generated at enrollment
- Recovery codes stored hashed (bcrypt)
- Account recovery via support with identity verification

## Session Management

### Session Properties

**Desktop Application:**
- Persistent session (refresh token)
- Auto-refresh before expiration
- Secure storage in OS keychain
- Logout clears all local data

**Web Application:**
- Session stored in HttpOnly cookie
- Automatic renewal on activity
- Idle timeout: 30 minutes
- Absolute timeout: 8 hours

### Concurrent Sessions

- **Allowed:** Yes (max 5 active sessions)
- **Tracking:** Device type, IP address, login time
- **Management:** Users can view and revoke sessions
- **Notification:** Email alert on new device login

## Privileged Access Management

### Admin Access

**Requirements:**
- MFA mandatory
- VPN required for production access
- Approval required for sensitive operations
- All actions logged

**Approval Workflow:**
- Database modifications: 2-person approval
- User data access: Approval + business justification
- System configuration: Change request ticket
- Emergency access: Documented post-incident

### Database Access

**Production Database:**
- No direct SQL access (except emergency)
- Read-only replicas for reporting
- Admin UI for common operations
- All queries logged

**Emergency Access:**
- Break-glass procedure documented
- Requires approval from 2 senior engineers
- Time-limited (4 hours max)
- Full audit trail
- Post-access review required

## Service Accounts

### API Service Accounts

**Creation:**
- Approved by security team
- Specific purpose documented
- Minimum required permissions
- Regular review (quarterly)

**Key Management:**
- Stored in secret management system (Vault)
- Automatic rotation (90 days)
- Encrypted at rest
- Access logged

**Monitoring:**
- Usage tracked and alerted
- Anomaly detection enabled
- Automatic disable on suspicious activity

## Access Reviews

### Regular Reviews

**Frequency:**
- User access: Quarterly
- Admin access: Monthly
- Service accounts: Quarterly
- API keys: Monthly

**Process:**
1. Generate access report
2. Manager reviews team access
3. Revoke unnecessary access
4. Document review completion
5. Remediate identified issues

### Automated Reviews

- Inactive accounts (90 days): Auto-disable
- Unused API keys (60 days): Alert owner
- Expired MFA enrollments: Force re-enrollment
- Failed login patterns: Temporary lockout

## Least Privilege Principle

### Implementation

- Default role: Authenticated User (minimal permissions)
- Explicit grant required for elevated access
- Time-limited elevated access where possible
- Regular permission audits
- Automatic downgrade when not needed

### Examples

**Temporary Admin Access:**
```typescript
// Grant admin access for 4 hours
await grantTemporaryAccess({
  userId: 'user-123',
  role: 'admin',
  duration: 4 * 60 * 60 * 1000, // 4 hours in ms
  reason: 'Customer support escalation #456',
  approver: 'manager-789',
});

// Access automatically revoked after expiration
```

## Audit Logging

All access control events are logged:

- Login attempts (success/failure)
- Logout events
- Permission grants/revocations
- Role changes
- Password resets
- MFA enrollments/usage
- API key creation/usage
- Failed authorization attempts
- Session creation/termination

See [Audit Trails](./audit-trails.md) for detailed logging documentation.

## Compliance

- **SOC 2:** All access controls documented and tested
- **GDPR:** Data access logged, subject to user rights
- **PCI DSS:** Cardholder data access restricted (Stripe only)
- **HIPAA:** Not applicable (no PHI processed)

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-10 | Initial documentation | Security Team |

**Next Review:** 2026-02-10
