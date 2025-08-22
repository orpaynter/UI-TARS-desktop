export { default as OrPaynterSetupWizard } from './OrPaynterSetupWizard';

// Export types for external use
export interface OrPaynterConfig {
  apiBase: string;
  token: string;
  enableClaims: boolean;
  enableAI: boolean;
  demoMode: boolean;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

// Utility functions for OrPaynter setup
export const createDefaultConfig = (): OrPaynterConfig => ({
  apiBase: '',
  token: '',
  enableClaims: true,
  enableAI: true,
  demoMode: true
});

export const validateConfig = (config: OrPaynterConfig): boolean => {
  if (config.demoMode) {
    return true; // Demo mode is always valid
  }
  
  return !!(config.apiBase && config.token);
};

export const generateEnvConfig = (config: OrPaynterConfig): Record<string, string> => {
  return {
    ORPAYNTER_API_BASE: config.apiBase || 'https://demo.orpaynter.com/api',
    ORPAYNTER_TOKEN: config.token || 'demo-token-12345',
    ORPAYNTER_ENABLE_CLAIMS: config.enableClaims.toString(),
    ORPAYNTER_ENABLE_AI: config.enableAI.toString(),
    ORPAYNTER_DEMO_MODE: config.demoMode.toString()
  };
};