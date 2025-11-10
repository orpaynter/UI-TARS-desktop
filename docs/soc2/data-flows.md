# Data Flows - SOC 2 Documentation

## Overview

This document describes all data flows within the OrPaynter platform, including data collection, processing, storage, and transmission.

## Data Flow Diagram

```
┌──────────────┐
│  End Users   │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────────────┐
│              Client Applications                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ UI-TARS      │  │  Funnel      │  │  Command     │  │
│  │  Desktop     │  │  System      │  │  Center      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/TLS 1.3
                             ↓
┌──────────────────────────────────────────────────────────┐
│              API Gateway (Rate Limited)                   │
└─────────┬────────────────────────────────────────────────┘
          │
          ↓
┌──────────────────────────────────────────────────────────┐
│              MCP Server Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Claims      │  │     AI       │  │   Browser    │  │
│  │  Server      │  │   Server     │  │   Server     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ Authenticated
                             ↓
┌──────────────────────────────────────────────────────────┐
│              Data Storage Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Supabase    │  │   Qdrant     │  │   Stripe     │  │
│  │  PostgreSQL  │  │   Vectors    │  │   Billing    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ Encrypted at rest
                             ↓
┌──────────────────────────────────────────────────────────┐
│              External Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     GA4      │  │     GTM      │  │   Clarity    │  │
│  │  Analytics   │  │  Tag Mgmt    │  │   Insights   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Data Classification

### Level 1: Public
- Marketing materials
- Public documentation
- Blog posts
- Press releases

**Protection:** Standard web security

### Level 2: Internal
- Internal documentation
- System logs (anonymized)
- Performance metrics
- Non-sensitive analytics

**Protection:** Authentication required, encrypted in transit

### Level 3: Confidential
- User account information
- Business data
- API keys (encrypted)
- System configurations

**Protection:** Authentication + authorization, encrypted in transit and at rest

### Level 4: Highly Confidential
- Payment information (PCI DSS)
- Personal identifiable information (PII)
- Authentication credentials
- Encryption keys

**Protection:** Strict access controls, encrypted in transit and at rest, audit logging

## Data Collection Points

### 1. User Registration (Funnel System)

**Data Collected:**
- Email address
- Name
- Company name (optional)
- Industry/role (optional)
- Phone number (optional)

**Purpose:** User authentication, account management
**Retention:** Active account + 90 days after deletion
**Legal Basis:** User consent, contract execution

### 2. Payment Information (Stripe)

**Data Collected:**
- Credit card number (tokenized by Stripe)
- Billing address
- Transaction history

**Purpose:** Payment processing, billing
**Retention:** Per PCI DSS requirements
**Legal Basis:** Contract execution
**Note:** Card numbers never stored in our systems; Stripe tokens only

### 3. Usage Analytics

**Data Collected:**
- Page views
- Feature usage
- Session duration
- Error logs
- Performance metrics

**Purpose:** Product improvement, support
**Retention:** 14 months
**Legal Basis:** Legitimate interest

### 4. AI Analysis Data

**Data Collected:**
- Uploaded images (roof photos)
- Property addresses (optional)
- Analysis results

**Purpose:** Service delivery
**Retention:** 90 days after analysis
**Legal Basis:** Service delivery, user consent

## Data Processing Activities

### Authentication Flow

```
User Login Attempt
    ↓
Supabase Auth validates credentials
    ↓
JWT token generated (expires in 1 hour)
    ↓
Token stored in secure HttpOnly cookie
    ↓
Client includes token in API requests
    ↓
MCP Server validates token
    ↓
Access granted/denied
    ↓
Action logged to audit trail
```

### Payment Processing Flow

```
User initiates purchase
    ↓
Client redirects to Stripe Checkout
    ↓
User enters payment info (on Stripe)
    ↓
Stripe processes payment
    ↓
Webhook notification to our API
    ↓
Subscription status updated in Supabase
    ↓
Confirmation email sent
    ↓
User granted access to paid features
```

### AI Analysis Flow

```
User uploads roof image
    ↓
Image uploaded to Supabase Storage (encrypted)
    ↓
Analysis request queued
    ↓
AI Server retrieves image
    ↓
Image analyzed (severity, damage types)
    ↓
Results stored in PostgreSQL
    ↓
Material estimate calculated
    ↓
Results returned to user
    ↓
Original image deleted after 90 days
```

## Data Transmission Security

### Encryption Standards

- **In Transit:** TLS 1.3, minimum 2048-bit RSA keys
- **At Rest:** AES-256 encryption
- **Database:** PostgreSQL native encryption
- **File Storage:** Supabase Storage with encryption

### Network Security

- All API endpoints require HTTPS
- HSTS headers enabled
- Certificate pinning for mobile apps
- Rate limiting: 100 requests/minute per IP
- DDoS protection via Cloudflare

## Data Storage

### Primary Database (Supabase PostgreSQL)

**Location:** US-East (configurable)
**Backup Frequency:** Daily automated backups
**Backup Retention:** 30 days
**Encryption:** AES-256 at rest
**Access:** VPN + IP whitelist + authentication

### Vector Database (Qdrant)

**Purpose:** Semantic search, embeddings
**Data Type:** Vector representations of text/images
**Retention:** Synchronized with primary database
**Encryption:** TLS for transmission, encrypted at rest

### File Storage (Supabase Storage)

**Purpose:** Image uploads, documents
**Encryption:** AES-256
**Access Control:** Row-level security (RLS)
**CDN:** Cloudflare with signed URLs

### Payment Data (Stripe)

**Note:** We do NOT store credit card numbers
**Stored Data:** Stripe customer IDs, payment method tokens
**PCI Compliance:** Stripe is PCI DSS Level 1 certified
**Access:** API keys stored in environment variables, rotated quarterly

## Data Sharing & Third Parties

### Analytics Services

| Service | Data Shared | Purpose | DPA |
|---------|-------------|---------|-----|
| Google Analytics 4 | Anonymized usage data | Product analytics | Yes |
| Google Tag Manager | Event data | Tag management | Yes |
| Microsoft Clarity | Session recordings | UX optimization | Yes |

### Infrastructure Services

| Service | Data Shared | Purpose | DPA |
|---------|-------------|---------|-----|
| Supabase | All application data | Database & auth | Yes |
| Stripe | Payment data | Payment processing | Yes |
| Qdrant | Vector embeddings | Semantic search | Yes |

### Data Processing Locations

- **Primary:** United States (US-East-1)
- **Backup:** United States (US-West-2)
- **CDN:** Global (Cloudflare)

All data processing occurs within the United States unless explicitly configured otherwise.

## Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| User accounts | Active + 90 days | Hard delete |
| Payment history | 7 years (legal requirement) | Archived, then deleted |
| Analytics data | 14 months | Automatic expiration |
| AI analysis images | 90 days | Automatic deletion |
| Audit logs | 2 years | Archived to cold storage |
| Session data | 30 days | Rolling deletion |
| Backup data | 30 days | Automatic deletion |

## Data Subject Rights (GDPR)

Users can exercise the following rights:

1. **Right to Access:** Export all personal data
2. **Right to Rectification:** Update incorrect data
3. **Right to Erasure:** Delete account and data
4. **Right to Restriction:** Pause data processing
5. **Right to Portability:** Receive data in machine-readable format
6. **Right to Object:** Opt-out of certain processing

**Request Process:**
- Email privacy@orpaynter.com
- Response within 30 days
- Identity verification required

## Data Breach Response

See [Incident Response](./incident-response.md) for detailed procedures.

**Key Points:**
- Detection within 24 hours (monitoring)
- Initial assessment within 4 hours
- Notification to affected users within 72 hours
- Regulatory notification as required
- Post-incident review and remediation

## Compliance & Auditing

- **Annual Review:** Data flows reviewed annually
- **Audit Trail:** All data access logged
- **Compliance Check:** Quarterly SOC 2 control testing
- **Vendor Assessment:** Annual security reviews

## Change Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-10 | Initial documentation | Compliance Team |

**Next Review:** 2026-02-10
