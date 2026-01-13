# FirstRunWizard Component

A multi-step wizard component for OrPaynter desktop application first-run setup.

## Features

- **4-step wizard flow**: Welcome → Sign in → API Keys → Finish
- **Dark theme**: Uses OrPaynter color tokens
- **Production-ready**: Requires real API keys for production use
- **API Key Management**: Configurable keys for OpenAI, Stripe, SendGrid, Twilio, Qdrant, and OpenWeather

## Usage

```tsx
import FirstRunWizard from '@/components/FirstRunWizard';

function App() {
  const handleComplete = (data) => {
    console.log('Setup complete:', data);
    // data includes:
    // - OPENAI_API_KEY?: string
    // - STRIPE_KEY?: string
    // - SENDGRID_KEY?: string
    // - TWILIO_KEY?: string
    // - QDRANT_URL?: string
    // - QDRANT_KEY?: string
    // - OPENWEATHER_KEY?: string
  };

  return (
    <FirstRunWizard
      onComplete={handleComplete}
      onCancel={() => console.log('Setup cancelled')}
      defaultKeys={{
        OPENAI_API_KEY: 'existing_key',
      }}
    />
  );
}
```

## Props

### `onComplete` (required)
- Type: `(keys: Keys) => void`
- Called when user completes the wizard
- Receives all configured keys

### `onCancel` (optional)
- Type: `() => void`
- Called when user clicks the Close button

### `defaultKeys` (optional)
- Type: `Partial<Keys>`
- Pre-populate API key fields with existing values

## Validation

The wizard requires at least the OpenAI API key to be configured before proceeding from the API Keys step. This ensures production-ready configuration.

## Integration Notes

The wizard includes placeholder buttons for OAuth/Token flows on step 2 (Sign in / Link Account). 
These need to be wired to your actual authentication implementation:

```tsx
// In FirstRunWizard.tsx, replace the alert() calls:
<button onClick={() => alert('TODO: Wire OAuth/Token modal')}>
  Sign in with OrPaynter
</button>
```

## Styling

The component uses inline styles with OrPaynter dark theme tokens:
- Background: `#0D1117`
- Secondary background: `#161B22`
- Accent: `#58A6FF`
- Text: `#C9D1D9`
- Muted text: `#8B949E`
- Live/primary: `#1F6FEB`

Tailwind utility classes are used for layout and spacing.
