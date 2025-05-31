import React, { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { messagesAtom } from '../../state/atoms/message';
import { activeSessionIdAtom, sessionsAtom } from '../../state/atoms/session';
import { replayStateAtom } from '../../state/atoms/replay';
import { connectionStatusAtom } from '../../state/atoms/ui';

/**
 * ReplayModeInitializer - Initializes the application state for replay mode
 * 
 * This component detects replay mode from window variables and sets up the
 * appropriate application state, preventing any server communication while
 * loading the replay data into the state atoms.
 */
export const ReplayModeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setMessages = useSetAtom(messagesAtom);
  const setSessions = useSetAtom(sessionsAtom);
  const setActiveSessionId = useSetAtom(activeSessionIdAtom);
  const setReplayState = useSetAtom(replayStateAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);

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

  return <>{children}</>;
};
