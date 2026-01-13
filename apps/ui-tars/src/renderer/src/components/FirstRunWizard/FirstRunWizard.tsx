/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';

// OrPaynter AI Dark Theme Tokens
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
  onComplete: (keys: Keys) => void;
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
      title: 'Welcome to OrPaynter AI',
      desc: 'Let\'s configure your desktop command center with real API credentials.'
    },
    {
      title: 'Sign in / Link Account',
      desc: 'Authenticate with your OrPaynter AI account.'
    },
    {
      title: 'Core API Keys',
      desc: 'Configure your API keys for production use.'
    },
    {
      title: 'Finish',
      desc: 'You\'re ready. We\'ll run a 10-second system check.'
    }
  ], []);

  const canNext = useMemo(() => {
    if (page === 2) {
      // Require at least ORPAYNTER_API_BASE and one API key
      const hasRequiredKeys = keys.OPENAI_API_KEY && keys.OPENAI_API_KEY.trim().length > 0;
      return hasRequiredKeys;
    }
    return true;
  }, [page, keys]);

  const next = () => setPage((p) => Math.min(p + 1, steps.length - 1));
  const back = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: colors.bg }}>
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>First-Run Setup</h2>
          {onCancel && (
            <button className="px-3 py-1 rounded-xl" style={{ background: colors.bg2, color: colors.textMuted }} onClick={onCancel}>Close</button>
          )}
        </div>

        {page === 0 && (
          <Step title={steps[0].title} desc={steps[0].desc}>
            <ul className="list-disc ml-6 text-sm" style={{ color: colors.textMuted }}>
              <li>Configure production API keys for real-world usage.</li>
              <li>Desktop logs are opt-in and privacy-respecting.</li>
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
                Sign in with OrPaynter AI
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
            <ul className="list-disc ml-6 text-sm" style={{ color: colors.textMuted }}>
              <li>AI analysis reachable: <span className="font-mono">mcp-orpaynter-ai</span></li>
              <li>Claims service reachable: <span className="font-mono">mcp-orpaynter-claims</span></li>
              <li>Weather hook ready (OpenWeather/NOAA)</li>
            </ul>
            <p className="mt-3 text-sm" style={{ color: colors.textMuted }}>You can revisit this wizard anytime in Settings -&gt; Setup.</p>
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
                onClick={() => onComplete(keys)}
              >Finish</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
