import { defineConfig } from '@tarko/agent-cli';

export default defineConfig({
  model: {
    provider: 'volcengine',
    id: 'ep-20250510145437-5sxhs',
    apiKey: process.env.ARK_API_KEY,
  },
});
