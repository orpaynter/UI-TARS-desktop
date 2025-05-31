import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { replayStateAtom } from '../state/atoms/replay';
import { activeSessionIdAtom, sessionsAtom } from '../state/atoms/session';
import { messagesAtom } from '../state/atoms/message';
import { connectionStatusAtom } from '../state/atoms/ui';

/**
 * ReplayModeContext - Global context for sharing replay mode state
 *
 * This context provides a centralized way to check if the application
 * is currently in replay mode, allowing components to adapt their behavior
 * without needing to directly access the replay state atom.
 */
interface ReplayModeContextType {
  isReplayMode: boolean;
}

const ReplayModeContext = createContext<ReplayModeContextType>({ isReplayMode: false });

/**
 * ReplayModeProvider - Provides replay mode state to the application and initializes replay data
 *
 * 1. Detects replay mode from window variables
 * 2. Initializes application state with replay data when in replay mode
 * 3. Prevents server communication in replay mode
 * 4. Provides the replay mode status to all child components
 */
export const ReplayModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Access necessary atoms
  const [replayState, setReplayState] = useAtom(replayStateAtom);
  const [, setMessages] = useAtom(messagesAtom);
  const [, setSessions] = useAtom(sessionsAtom);
  const [, setActiveSessionId] = useAtom(activeSessionIdAtom);
  const [, setConnectionStatus] = useAtom(connectionStatusAtom);

  // Initialize replay mode if window variables are present
  useEffect(() => {
    // Check if in replay mode
    if (window.AGENT_TARS_REPLAY_MODE && window.AGENT_TARS_EVENT_STREAM) {
      // Get session data and event stream
      const sessionData = window.AGENT_TARS_SESSION_DATA;
      const events = window.AGENT_TARS_EVENT_STREAM;

      console.log('[ReplayMode] Initializing replay mode with', events.length, 'events');

      if (sessionData && sessionData.id) {
        // Set connection status to "offline" to prevent health checks
        setConnectionStatus({
          connected: false, // Mark as disconnected to prevent API calls
          lastConnected: null,
          lastError: null,
          reconnecting: false,
        });

        // Set sessions data
        setSessions([sessionData]);
        setActiveSessionId(sessionData.id);

        // Initialize replay state
        setReplayState({
          isActive: true,
          isPaused: false, // Auto-start replay
          events: events,
          currentEventIndex: -1,
          startTimestamp: events.length > 0 ? events[0].timestamp : null,
          endTimestamp: events.length > 0 ? events[events.length - 1].timestamp : null,
          playbackSpeed: 1,
          visibleTimeWindow:
            events.length > 0
              ? {
                  start: events[0].timestamp,
                  end: events[events.length - 1].timestamp,
                }
              : null,
          processedEvents: {},
        });

        // Initialize empty messages state
        setMessages({
          [sessionData.id]: [],
        });

        console.log('[ReplayMode] Replay mode initialized successfully');
      }
    }
  }, [setMessages, setSessions, setActiveSessionId, setReplayState, setConnectionStatus]);

  // Check both the atom and global window variable for replay mode
  const isReplayMode = replayState.isActive || !!window.AGENT_TARS_REPLAY_MODE;

  return (
    <ReplayModeContext.Provider value={{ isReplayMode }}>{children}</ReplayModeContext.Provider>
  );
};

/**
 * useReplayMode - Hook to access replay mode state
 *
 * This hook provides a convenient way for components to check if the
 * application is currently in replay mode and adapt their behavior accordingly.
 */
export const useReplayMode = (): boolean => {
  const { isReplayMode } = useContext(ReplayModeContext);
  return isReplayMode;
};
