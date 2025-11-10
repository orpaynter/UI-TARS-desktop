# Google Analytics 4 Connector

Official OrPaynter connector for Google Analytics 4 (GA4).

## Installation

```bash
npm install @orpaynter/connector-ga4
# or
pnpm add @orpaynter/connector-ga4
```

## Setup

### 1. Get your GA4 Measurement ID and API Secret

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to Admin → Data Streams
3. Select your data stream
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
5. Create a **Measurement Protocol API secret** in the Data Stream settings

### 2. Initialize the connector

```typescript
import { createGA4Connector } from '@orpaynter/connector-ga4';

const ga4 = createGA4Connector({
  measurementId: 'G-XXXXXXXXXX',
  apiSecret: 'your_api_secret'
});
```

## Usage

### Track Events

```typescript
// Basic event tracking
await ga4.trackEvent({
  name: 'button_click',
  params: {
    button_name: 'cta_primary',
    page: '/landing'
  }
}, {
  client_id: 'unique_client_id',
  user_id: 'user_123' // optional
});
```

### Track Page Views

```typescript
await ga4.trackPageView({
  page_title: 'Home Page',
  page_location: 'https://example.com/',
  page_referrer: 'https://google.com'
}, {
  client_id: 'unique_client_id'
});
```

### Track Conversions

```typescript
await ga4.trackConversion({
  currency: 'USD',
  value: 99.99,
  transaction_id: 'tx_12345',
  items: [
    {
      item_id: 'SKU_123',
      item_name: 'Premium Plan',
      quantity: 1,
      price: 99.99
    }
  ]
}, {
  client_id: 'unique_client_id',
  user_id: 'user_123'
});
```

### Track User Sign Up

```typescript
await ga4.trackSignUp('email', {
  client_id: 'unique_client_id',
  user_id: 'user_123'
});
```

### Track User Login

```typescript
await ga4.trackLogin('google', {
  client_id: 'unique_client_id',
  user_id: 'user_123'
});
```

### Batch Tracking

```typescript
const events = [
  { name: 'event1', params: { param1: 'value1' } },
  { name: 'event2', params: { param2: 'value2' } },
  // ... up to 25 events
];

await ga4.trackBatch(events, {
  client_id: 'unique_client_id'
});
```

### Validate Configuration

```typescript
const isValid = await ga4.validate({
  client_id: 'test_client'
});

if (!isValid) {
  console.error('GA4 configuration is invalid');
}
```

## Client ID Generation

GA4 requires a `client_id` to identify unique users. You should:

1. **Web Applications:** Use the GA4 JavaScript snippet's client ID or generate a UUID
2. **Server-side:** Generate a UUID v4 and store it per user session
3. **Mobile Apps:** Use device ID or generate a UUID on first launch

Example:

```typescript
import { randomUUID } from 'crypto';

// Generate a client ID
const clientId = randomUUID();

// Or use from existing GA4 cookie
const clientId = document.cookie
  .split('; ')
  .find(row => row.startsWith('_ga='))
  ?.split('.').slice(-2).join('.');
```

## User Properties

You can set custom user properties:

```typescript
await ga4.trackEvent({
  name: 'page_view',
  params: { page_title: 'Dashboard' }
}, {
  client_id: 'unique_client_id',
  user_id: 'user_123',
  user_properties: {
    plan_type: { value: 'premium' },
    account_age_days: { value: 365 },
    is_contractor: { value: true }
  }
});
```

## Event Parameters

GA4 supports custom parameters for events:

```typescript
await ga4.trackEvent({
  name: 'roof_analysis_complete',
  params: {
    severity_score: 0.72,
    damage_types: 'hail,wind',
    property_type: 'residential',
    analysis_duration_ms: 1234
  }
}, {
  client_id: 'unique_client_id'
});
```

## Error Handling

```typescript
try {
  await ga4.trackEvent(event, user);
} catch (error) {
  console.error('Failed to track event:', error);
  // Event tracking failure should not break your application
  // Consider logging to your error tracking service
}
```

## Pricing Tiers

### Free Tier
- Up to 10 million events/month
- Included with all OrPaynter plans

### Enterprise Tier
- Unlimited events
- Priority support
- Custom dimensions and metrics
- BigQuery export
- Contact sales@orpaynter.com

## Best Practices

1. **Don't Block on Tracking:** Track events asynchronously
2. **Batch When Possible:** Use `trackBatch` for multiple events
3. **Consistent Naming:** Use snake_case for event and parameter names
4. **Add Context:** Include relevant parameters for better insights
5. **Test in Debug Mode:** Use the GA4 DebugView before production

## Debugging

Use the GA4 DebugView to see events in real-time:

1. Enable debug mode by adding `&debug_mode=true` to your tracking
2. Or use validation endpoint (done automatically in `validate()`)
3. View events in Analytics → Configure → DebugView

## TypeScript Support

This package is written in TypeScript and includes full type definitions.

```typescript
import type { GA4Event, GA4User, GA4Config } from '@orpaynter/connector-ga4';
```

## Examples

See the `/examples` directory for complete working examples:

- Basic event tracking
- E-commerce tracking
- User journey tracking
- Server-side tracking
- React integration
- Node.js integration

## Support

- Documentation: https://orpaynter.com/docs/connectors/ga4
- Issues: https://github.com/orpaynter/UI-TARS-desktop/issues
- Email: support@orpaynter.com

## License

MIT
