# @orpaynter/connector-clarity

Microsoft Clarity connector for OrPaynter providing session replay, heatmaps, and user behavior analytics.

## Features

- ✅ **Session Replay** - Record and replay user sessions
- ✅ **Heatmaps** - Click, scroll, and attention heatmaps
- ✅ **Custom Events** - Track custom user interactions
- ✅ **User Identification** - Identify and tag users
- ✅ **GDPR Compliant** - Cookie consent support
- ✅ **Full TypeScript Support** - Complete type definitions

## Installation

```bash
npm install @orpaynter/connector-clarity
# or
pnpm add @orpaynter/connector-clarity
```

## Quick Start

```typescript
import { createClarityConnector } from '@orpaynter/connector-clarity';

const clarity = createClarityConnector({
  projectId: 'your-clarity-project-id'
});

// Track custom events
await clarity.trackEvent('estimate_generated', { value: 5499.99 });

// Tag sessions
await clarity.tagSession('contractor_type', 'residential');

// Identify users
await clarity.identifyUser('user-123', {
  email: 'contractor@example.com',
  plan: 'professional'
});
```

## API Reference

### Event Tracking

- `trackEvent(eventName, properties?)` - Track custom event
- `trackPageView(pageName?, properties?)` - Track page view
- `trackClick(elementName, properties?)` - Track click
- `trackFormSubmit(formName, properties?)` - Track form submission
- `trackError(errorMessage, properties?)` - Track error
- `trackConversion(conversionName, value?, properties?)` - Track conversion

### User Management

- `identifyUser(userId, metadata?)` - Identify user
- `tagSession(key, value)` - Tag current session
- `getSessionId()` - Get current session ID

### Utility

- `isReady()` - Check if Clarity is loaded
- `initialize()` - Manually initialize Clarity
- `upgradeSession()` - Upgrade session (GDPR)

## Examples

### Contractor Dashboard

```typescript
// Track contractor login
clarity.identifyUser('contractor-123', {
  email: 'contractor@example.com',
  company: 'Acme Roofing',
  plan_tier: 'professional'
});

clarity.tagSession('user_type', 'contractor');
clarity.trackEvent('dashboard_view');
```

### Project Estimation

```typescript
// Track estimate generation
clarity.trackEvent('estimate_started', {
  project_type: 'roof_replacement'
});

// Track completion
clarity.trackConversion('estimate_generated', 5499.99, {
  project_type: 'roof_replacement',
  materials: 'premium'
});
```

### Form Tracking

```typescript
// Track form interactions
clarity.trackFormSubmit('quote_request', {
  lead_source: 'website',
  service_type: 'residential'
});
```

### Error Tracking

```typescript
// Track errors
try {
  await generateEstimate();
} catch (error) {
  clarity.trackError(error.message, {
    function: 'generateEstimate',
    severity: 'high'
  });
}
```

## Best Practices

### Privacy & GDPR

```typescript
// Request consent before upgrading
if (userConsented) {
  clarity.upgradeSession();
}
```

### Performance

- Events are queued and sent asynchronously
- Clarity script loads asynchronously
- Minimal performance impact

### Session Management

```typescript
// Get session ID for support tickets
const sessionId = clarity.getSessionId();
console.log('Clarity Session:', sessionId);
```

## Use Cases

### Contractor Onboarding

```typescript
clarity.trackEvent('onboarding_step', { step: 1, name: 'company_info' });
clarity.trackEvent('onboarding_step', { step: 2, name: 'license_upload' });
clarity.trackEvent('onboarding_complete');
```

### Funnel Analysis

```typescript
clarity.trackEvent('funnel_step', { step: 'landing' });
clarity.trackEvent('funnel_step', { step: 'estimate_form' });
clarity.trackEvent('funnel_step', { step: 'payment' });
clarity.trackConversion('subscription_purchased', 99.99);
```

### Feature Usage

```typescript
clarity.trackClick('3d_visualizer_button');
clarity.trackEvent('visualizer_material_changed', {
  material: 'gaf-charcoal',
  category: 'shingles'
});
```

## License

MIT
