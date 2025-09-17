/**
 * OrPaynter integration hooks
 */
import { useEffect } from 'react';
import { useOrPaynterStore } from '@/renderer/src/store/orpaynter';

export const useOrPaynterIntegration = () => {
  const {
    isConfigured,
    showFirstRunWizard,
    config,
    setShowFirstRunWizard,
    claimsServerRunning,
    aiServerRunning,
    setClaimsServerStatus,
    setAiServerStatus,
  } = useOrPaynterStore();

  // Check if this is a first-time user
  useEffect(() => {
    const checkFirstTimeUser = () => {
      // If not configured and haven't seen wizard, show it
      if (!isConfigured && showFirstRunWizard) {
        setShowFirstRunWizard(true);
      }
    };

    checkFirstTimeUser();
  }, [isConfigured, showFirstRunWizard, setShowFirstRunWizard]);

  // Start MCP servers when configured
  useEffect(() => {
    if (isConfigured && config) {
      startMcpServers();
    }
  }, [isConfigured, config]);

  const startMcpServers = async () => {
    if (!config) return;

    try {
      // Start OrPaynter MCP servers via Electron main process
      if (typeof window !== 'undefined' && window.electron) {
        if (config.enableClaims) {
          const claimsResult = await window.electron.orpaynter.startClaimsServer();
          setClaimsServerStatus(claimsResult.success);
        }

        if (config.enableAI) {
          const aiResult = await window.electron.orpaynter.startAiServer();
          setAiServerStatus(aiResult.success);
        }
      }
    } catch (error) {
      console.error('Failed to start OrPaynter MCP servers:', error);
    }
  };

  const stopMcpServers = async () => {
    try {
      if (typeof window !== 'undefined' && window.electron) {
        await window.electron.orpaynter.stopServers();
        setClaimsServerStatus(false);
        setAiServerStatus(false);
      }
    } catch (error) {
      console.error('Failed to stop OrPaynter MCP servers:', error);
    }
  };

  return {
    isConfigured,
    showFirstRunWizard,
    config,
    claimsServerRunning,
    aiServerRunning,
    startMcpServers,
    stopMcpServers,
  };
};