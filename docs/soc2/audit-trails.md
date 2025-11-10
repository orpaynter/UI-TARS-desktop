# Audit Trails - SOC 2 Documentation

## Overview

This document describes the audit trail and logging mechanisms implemented in the OrPaynter platform to ensure accountability, traceability, and compliance.

## Audit Logging Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Application Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Desktop     │  │     Web      │  │     API      │  │
│  │    App       │  │    Apps      │  │   Servers    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ Structured Logs
                             ↓
┌──────────────────────────────────────────────────────────┐
│              Log Collection Layer                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Logstash / Fluentd                     │   │
│  │  - Parse and normalize logs                      │   │
│  │  - Enrich with metadata                          │   │
│  │  - Filter and route                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────┬────────────────────────────────────────────────┘
          │
          ↓
┌──────────────────────────────────────────────────────────┐
│              Log Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Elasticsearch│  │   PostgreSQL │  │   S3/GCS     │  │
│  │ (Hot: 30d)   │  │  (Metadata)  │  │ (Cold: 2y)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────┬────────────────────────────────────────────────┘
          │
          ↓
┌──────────────────────────────────────────────────────────┐
│              Analysis & Alerting Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Kibana    │  │   Datadog    │  │ SIEM/SOAR    │  │
│  │  (Analysis)  │  │  (Alerting)  │  │ (Security)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Log Categories

### 1. Authentication Logs

**Events Logged:**
- User login attempts (success/failure)
- Password changes
- MFA enrollment/usage
- Session creation/termination
- Password reset requests
- Account lockouts
- OAuth flows

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "authentication",
  "event_action": "login_attempt",
  "status": "success",
  "user_id": "usr_abc123",
  "email": "user@example.com",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "mfa_method": "totp",
  "session_id": "sess_xyz789",
  "geolocation": {
    "country": "US",
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Retention:** 2 years

### 2. Authorization Logs

**Events Logged:**
- Permission grants/revocations
- Role assignments/changes
- Access denials
- Privilege escalation
- Resource access attempts

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "authorization",
  "event_action": "access_denied",
  "user_id": "usr_abc123",
  "resource_type": "claim",
  "resource_id": "clm_def456",
  "required_permission": "claims:update",
  "user_permissions": ["claims:read"],
  "ip_address": "192.168.1.100",
  "request_id": "req_ghi789"
}
```

**Retention:** 2 years

### 3. Data Access Logs

**Events Logged:**
- Database queries (sensitive data)
- File access/download
- API calls
- Data exports
- Bulk operations

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "data_access",
  "event_action": "query_execution",
  "user_id": "usr_abc123",
  "query_type": "SELECT",
  "table_name": "users",
  "rows_affected": 1,
  "sensitive_data": true,
  "data_classification": "confidential",
  "purpose": "user_profile_view",
  "ip_address": "192.168.1.100"
}
```

**Retention:** 2 years (7 years for PCI data)

### 4. Data Modification Logs

**Events Logged:**
- Record creation/updates/deletions
- Configuration changes
- Schema modifications
- Bulk updates

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "data_modification",
  "event_action": "update",
  "user_id": "usr_abc123",
  "table_name": "claims",
  "record_id": "clm_def456",
  "fields_changed": ["status", "amount"],
  "before_values": {
    "status": "pending",
    "amount": 1000.00
  },
  "after_values": {
    "status": "approved",
    "amount": 1500.00
  },
  "reason": "claim_adjustment"
}
```

**Retention:** 7 years (compliance requirement)

### 5. System Events

**Events Logged:**
- System startup/shutdown
- Service deployments
- Configuration changes
- Backup operations
- Failover events
- Performance alerts

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "system_event",
  "event_action": "deployment",
  "service_name": "orpaynter-api",
  "version": "2.1.0",
  "environment": "production",
  "deployed_by": "usr_ops123",
  "commit_hash": "abc123def456",
  "status": "success"
}
```

**Retention:** 1 year

### 6. Security Events

**Events Logged:**
- Intrusion attempts
- Malware detection
- Vulnerability scans
- Security policy violations
- Anomalous behavior

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "security_event",
  "event_action": "intrusion_attempt",
  "severity": "high",
  "source_ip": "203.0.113.42",
  "target": "api.orpaynter.com/admin",
  "attack_type": "sql_injection",
  "blocked": true,
  "rule_triggered": "WAF_RULE_123"
}
```

**Retention:** 2 years

### 7. Payment Logs

**Events Logged:**
- Payment attempts
- Refunds
- Subscription changes
- Billing updates

**Data Captured:**
```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "payment",
  "event_action": "charge_success",
  "user_id": "usr_abc123",
  "amount": 99.00,
  "currency": "USD",
  "stripe_payment_id": "pi_xyz789",
  "payment_method": "card_****1234",
  "subscription_id": "sub_abc123",
  "status": "succeeded"
}
```

**Retention:** 7 years (PCI DSS requirement)

**Note:** Actual payment card data is NOT logged (handled by Stripe only)

## Log Standards

### Format

**Standard:** JSON structured logging
**Schema:** ECS (Elastic Common Schema) compatible
**Encoding:** UTF-8

### Required Fields

Every log entry must include:
- `timestamp` (ISO 8601 format)
- `event_type` (category)
- `event_action` (specific action)
- `user_id` or `system_id` (actor)
- `ip_address` (when applicable)
- `request_id` (for correlation)

### Sensitive Data Handling

**Prohibited in Logs:**
- Plain text passwords
- Credit card numbers (full or partial)
- Social Security Numbers
- Authentication tokens (except hashed)
- Private keys
- PII without business justification

**Allowed (with encryption):**
- Email addresses (when necessary)
- Usernames
- IP addresses
- Device identifiers

### Log Levels

**ERROR:** System errors, exceptions
**WARN:** Warnings, degraded performance
**INFO:** Normal operations, significant events
**DEBUG:** Detailed diagnostic information (dev/staging only)

## Log Retention Policy

| Log Type | Hot Storage | Warm Storage | Cold Storage | Total Retention |
|----------|-------------|--------------|--------------|-----------------|
| Authentication | 30 days | 6 months | 18 months | 2 years |
| Authorization | 30 days | 6 months | 18 months | 2 years |
| Data Access | 30 days | 6 months | 18 months | 2 years |
| Data Modification | 90 days | 1 year | 6 years | 7 years |
| System Events | 30 days | 3 months | 9 months | 1 year |
| Security Events | 30 days | 6 months | 18 months | 2 years |
| Payment Logs | 90 days | 1 year | 6 years | 7 years |

**Hot Storage:** Elasticsearch (fast queries)
**Warm Storage:** S3/GCS (compressed, indexed)
**Cold Storage:** Glacier/Coldline (archive)

## Log Access Controls

### Who Can Access Logs

| Role | Access Level | Purpose |
|------|--------------|---------|
| Developers | Read (own service logs) | Debugging, monitoring |
| DevOps | Read (all operational logs) | System administration |
| Security Team | Read (all logs) | Security monitoring, investigations |
| Compliance Team | Read (audit logs) | Compliance audits |
| Legal | Read (with approval) | Legal investigations |
| Auditors | Read (time-limited) | External audits |

### Access Logging

All log access is itself logged:

```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "event_type": "log_access",
  "accessed_by": "usr_sec123",
  "log_type": "authentication",
  "time_range": "2025-11-09T00:00:00Z to 2025-11-10T00:00:00Z",
  "query": "user_id:usr_abc123",
  "purpose": "security_investigation",
  "approval_ticket": "SEC-12345"
}
```

## Monitoring and Alerting

### Real-time Alerts

**Critical Alerts (Immediate):**
- Multiple failed login attempts (>5 in 5 minutes)
- Privilege escalation attempts
- Data exfiltration patterns
- Unauthorized database access
- System failures

**High Priority Alerts (Within 15 minutes):**
- Unusual access patterns
- Large data exports
- Failed authorization attempts (>10)
- Configuration changes in production
- Security policy violations

**Medium Priority Alerts (Within 1 hour):**
- Performance degradation
- Unusual traffic patterns
- API rate limit violations
- Backup failures

### Alerting Channels

- **Critical:** PagerDuty (SMS + Phone)
- **High:** Slack #security-alerts
- **Medium:** Email to security team
- **Low:** Daily digest email

## Audit Trail Queries

### Common Audit Queries

**User Activity Report:**
```
event_type:* AND user_id:"usr_abc123" 
AND timestamp:[2025-11-09 TO 2025-11-10]
```

**Failed Login Attempts:**
```
event_type:authentication 
AND event_action:login_attempt 
AND status:failure
```

**Data Modifications by Table:**
```
event_type:data_modification 
AND table_name:"claims" 
AND timestamp:[now-7d TO now]
```

**Privileged Access:**
```
event_type:authorization 
AND (user_role:admin OR user_role:super_admin)
```

**Sensitive Data Access:**
```
event_type:data_access 
AND sensitive_data:true 
AND data_classification:confidential
```

## Log Integrity

### Tamper Protection

**Mechanisms:**
- Write-once log storage
- Cryptographic hashing of log entries
- Log signing with private key
- Immutable S3 buckets
- Separate log infrastructure (network isolated)

**Hash Chain:**
Each log entry includes hash of previous entry:

```json
{
  "timestamp": "2025-11-10T00:08:23.567Z",
  "entry_id": "log_12345",
  "previous_hash": "abc123...",
  "current_hash": "def456...",
  "data": { /* log entry */ },
  "signature": "rsa_signature..."
}
```

### Verification

- Automated integrity checks (daily)
- Hash chain verification
- Signature validation
- Anomaly detection for missing logs

## Compliance Reporting

### SOC 2 Audit Reports

**Generated:** Quarterly
**Contents:**
- Authentication events summary
- Authorization events summary
- Data access patterns
- Privileged user activity
- Security incidents
- System changes

### GDPR Data Subject Access Requests

**Timeline:** Within 30 days
**Contents:**
- All logs related to user
- Data access history
- Data modification history
- Export in machine-readable format

### PCI DSS Compliance

**Requirements Met:**
- All payment-related events logged
- 7-year retention for payment logs
- Audit trail protection
- Daily log reviews
- Quarterly reporting

## Log Analysis Tools

### ELK Stack (Primary)

**Elasticsearch:**
- Full-text search
- Aggregations and analytics
- Real-time indexing

**Logstash:**
- Log ingestion
- Parsing and transformation
- Filtering and enrichment

**Kibana:**
- Visualization dashboards
- Query interface
- Alert management

### Supplementary Tools

- **Datadog:** Real-time monitoring and alerting
- **Splunk:** Advanced analytics (limited use)
- **CloudWatch:** AWS infrastructure logs
- **pgAudit:** PostgreSQL database auditing

## Incident Investigation

### Investigation Process

1. **Identify scope:** Determine time range and affected systems
2. **Collect logs:** Gather all relevant log entries
3. **Preserve evidence:** Create immutable copies
4. **Analyze patterns:** Look for indicators of compromise
5. **Timeline reconstruction:** Build event timeline
6. **Document findings:** Create investigation report

### Log Correlation

**Cross-reference:**
- Authentication events with data access
- IP addresses with user accounts
- Session IDs across services
- Request IDs end-to-end

### Export for Legal/Regulatory

**Format:** JSON + human-readable PDF
**Certification:** Chain of custody documentation
**Delivery:** Encrypted transfer
**Retention:** Per legal requirements

## Automated Log Analysis

### Anomaly Detection

**Machine Learning Models:**
- Unusual access patterns
- Abnormal data volumes
- Geographic anomalies
- Time-based anomalies

**Triggers:**
- Access at unusual hours
- Access from new location
- Bulk operations
- Rapid successive actions

### Behavior Analytics

**User Behavior Analytics (UBA):**
- Baseline normal behavior
- Detect deviations
- Risk scoring
- Alert on high-risk activities

**Example Rules:**
```
IF user_location != previous_location_30d
   AND data_access_volume > baseline_3x
   THEN alert(high_risk_behavior)
```

## Performance Optimization

### Log Volume Management

- Sampling for high-volume logs (e.g., API requests)
- Aggregation before storage
- Compression in transit and at rest
- Tiered storage strategy

### Query Performance

- Pre-computed aggregations
- Time-based indices
- Appropriate shard configuration
- Query result caching

## Change Control

### Log Configuration Changes

**Approval Required For:**
- Log retention policy changes
- Log level modifications (production)
- New log sources
- Alert threshold changes

**Change Process:**
1. Submit change request
2. Security team review
3. Test in staging
4. Gradual production rollout
5. Monitor for issues

## Training

### Log Analysis Training

**Frequency:** Quarterly
**Participants:** Security team, DevOps, compliance
**Topics:**
- Query syntax
- Investigation techniques
- Tool usage
- Compliance requirements

## Metrics and KPIs

### Log Health Metrics

- **Log Completeness:** Percentage of expected logs received
- **Log Latency:** Time from event to indexed
- **Query Performance:** Average query response time
- **Alert Accuracy:** True positive rate for alerts

### Audit Metrics

- **Time to Detect:** Average time to detect security events
- **Investigation Time:** Average time to complete investigations
- **Compliance Coverage:** Percentage of audit requirements met

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-10 | Initial documentation | Security Team |

**Next Review:** 2026-02-10

## Related Documents

- [Incident Response](./incident-response.md)
- [Access Controls](./access-controls.md)
- [Data Flows](./data-flows.md)
