import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'jotai';
import { App } from './components/App';
import { ReplayModeInitializer } from './components/Replay/ReplayModeInitializer';
import { ReplayModeProvider } from './context/ReplayModeContext';

/**
 * Agent TARS Web UI v2 - Entry Component
 *
 * Provides the Jotai atom provider and initializes theme based on user preference.
 * Includes ReplayModeInitializer and ReplayModeProvider for proper replay handling.
 */
export const AgentTARSWebUI: React.FC = () => {
  // Initialize theme based on user preference
  React.useEffect(() => {
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Check if theme is stored in localStorage
    const storedTheme = localStorage.getItem('agent-tars-theme');

    // Apply dark mode if preferred or stored
    if (storedTheme === 'dark' || (storedTheme === null && prefersDarkMode)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for theme preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (storedTheme === null) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <Provider>
      <ReplayModeInitializer>
        <ReplayModeProvider>
          <App />
        </ReplayModeProvider>
      </ReplayModeInitializer>
    </Provider>
  );
};

// Render the new v2 architecture with router support
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AgentTARSWebUI />
  </React.StrictMode>,
);
