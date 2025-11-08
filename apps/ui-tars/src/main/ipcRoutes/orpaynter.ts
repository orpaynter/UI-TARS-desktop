/**
 * OrPaynter IPC routes - Secure API key handling
 * API keys are stored server-side only and never exposed to renderer
 */
import { initIpc } from '@ui-tars/electron-ipc/main';
import { z } from 'zod';

const t = initIpc.create();

// Secure storage for API keys (server-side only)
let orpaynerConfig: any = null;

// Schema for OrPaynter config
const OrPaynterConfigSchema = z.object({
  demoMode: z.boolean(),
  apiBase: z.string().optional(),
  token: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']),
  enableAI: z.boolean(),
  enableClaims: z.boolean(),
  openaiKey: z.string().optional(),
  stripeKey: z.string().optional(),
});

// Masked version for client display
function getMaskedConfig(config: any) {
  if (!config) return null;
  
  return {
    demoMode: config.demoMode,
    apiBase: config.apiBase,
    environment: config.environment,
    enableAI: config.enableAI,
    enableClaims: config.enableClaims,
    // Mask all sensitive keys - only indicate if they exist
    hasToken: !!config.token,
    hasOpenAIKey: !!config.openaiKey,
    hasStripeKey: !!config.stripeKey,
  };
}

// Get secure environment variables from .env
function getSecureEnvVars() {
  return {
    ORPAYNTER_API_BASE: process.env.ORPAYNTER_API_BASE,
    ORPAYNTER_TOKEN: process.env.ORPAYNTER_TOKEN,
    ORPAYNTER_ENVIRONMENT: process.env.ORPAYNTER_ENVIRONMENT,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_KEY: process.env.STRIPE_KEY,
    SENDGRID_KEY: process.env.SENDGRID_KEY,
    TWILIO_KEY: process.env.TWILIO_KEY,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_KEY: process.env.QDRANT_KEY,
    OPENWEATHER_KEY: process.env.OPENWEATHER_KEY,
  };
}

export const orpaynerRoute = {
  'orpaynter:setConfig': t.procedure
    .input(OrPaynterConfigSchema)
    .handle(async ({ input }) => {
      // Store config securely on server side
      orpaynerConfig = input;
      return { success: true };
    }),

  'orpaynter:getConfig': t.procedure
    .handle(async () => {
      // Return masked version to client
      return getMaskedConfig(orpaynerConfig);
    }),

  'orpaynter:startClaimsServer': t.procedure
    .handle(async () => {
      try {
        const secureEnv = getSecureEnvVars();
        
        // TODO: Start MCP server process with secure environment
        // The actual API keys from .env are used here, not the client config
        
        return { 
          success: true, 
          message: 'Claims server started with secure credentials' 
        };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }),

  'orpaynter:startAiServer': t.procedure
    .handle(async () => {
      try {
        const secureEnv = getSecureEnvVars();
        
        // TODO: Start MCP server process with secure environment
        // The actual API keys from .env are used here, not the client config
        
        return { 
          success: true, 
          message: 'AI server started with secure credentials' 
        };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }),

  'orpaynter:stopServers': t.procedure
    .handle(async () => {
      try {
        // TODO: Stop MCP server processes
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }),

  'orpaynter:getServerStatus': t.procedure
    .handle(async () => {
      return {
        claimsServerRunning: false, // TODO: Check actual status
        aiServerRunning: false, // TODO: Check actual status
      };
    }),
};
