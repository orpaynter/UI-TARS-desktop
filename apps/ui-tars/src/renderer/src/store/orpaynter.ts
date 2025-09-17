/**
 * OrPaynter state management store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrPaynterConfig {
  demoMode: boolean;
  apiBase?: string;
  token?: string;
  environment: 'development' | 'staging' | 'production';
  enableAI: boolean;
  enableClaims: boolean;
  openaiKey?: string;
  stripeKey?: string;
}

interface OrPaynterState {
  // Configuration
  isConfigured: boolean;
  showFirstRunWizard: boolean;
  config: OrPaynterConfig | null;
  
  // Actions
  setConfig: (config: OrPaynterConfig) => void;
  setConfigured: (configured: boolean) => void;
  setShowFirstRunWizard: (show: boolean) => void;
  skipFirstRun: () => void;
  completeFirstRun: (config: OrPaynterConfig) => void;
  
  // MCP Server Status
  claimsServerRunning: boolean;
  aiServerRunning: boolean;
  setClaimsServerStatus: (running: boolean) => void;
  setAiServerStatus: (running: boolean) => void;
}

export const useOrPaynterStore = create<OrPaynterState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConfigured: false,
      showFirstRunWizard: true,
      config: null,
      claimsServerRunning: false,
      aiServerRunning: false,

      // Configuration actions
      setConfig: (config) => {
        set({ config });
      },

      setConfigured: (configured) => {
        set({ isConfigured: configured });
      },

      setShowFirstRunWizard: (show) => {
        set({ showFirstRunWizard: show });
      },

      skipFirstRun: () => {
        set({ 
          showFirstRunWizard: false,
          isConfigured: true,
          config: {
            demoMode: true,
            environment: 'development',
            enableAI: true,
            enableClaims: true,
          }
        });
      },

      completeFirstRun: (config) => {
        set({
          config,
          isConfigured: true,
          showFirstRunWizard: false,
        });
        
        // Store config in environment variables for MCP servers
        if (typeof window !== 'undefined' && window.electron) {
          window.electron.orpaynter.setConfig(config);
        }
      },

      // MCP Server status
      setClaimsServerStatus: (running) => {
        set({ claimsServerRunning: running });
      },

      setAiServerStatus: (running) => {
        set({ aiServerRunning: running });
      },
    }),
    {
      name: 'orpaynter-config',
      partialize: (state) => ({
        isConfigured: state.isConfigured,
        config: state.config,
        showFirstRunWizard: state.showFirstRunWizard,
      }),
    }
  )
);