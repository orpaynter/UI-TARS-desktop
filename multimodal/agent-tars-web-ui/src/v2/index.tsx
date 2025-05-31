import React, { useEffect } from 'react';
import { Provider, useSetAtom } from 'jotai';
import { App } from './components/App';
import { messagesAtom } from './state/atoms/message';
import { activeSessionIdAtom, sessionsAtom } from './state/atoms/session';
import { replayStateAtom } from './state/atoms/replay';

/**
 * 回放模式检测和初始化组件
 */
const ReplayModeInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setMessages = useSetAtom(messagesAtom);
  const setSessions = useSetAtom(sessionsAtom);
  const setActiveSessionId = useSetAtom(activeSessionIdAtom);
  const setReplayState = useSetAtom(replayStateAtom);

  useEffect(() => {
    // 检查是否处于回放模式
    if (window.AGENT_TARS_REPLAY_MODE && window.AGENT_TARS_EVENT_STREAM) {
      // 获取会话数据和事件流
      const sessionData = window.AGENT_TARS_SESSION_DATA;
      const events = window.AGENT_TARS_EVENT_STREAM;

      if (sessionData && sessionData.id) {
        // 设置会话数据
        setSessions([sessionData]);
        setActiveSessionId(sessionData.id);

        // 初始化回放状态
        setReplayState({
          isActive: true,
          isPaused: false,
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

        // 初始化消息状态
        setMessages({
          [sessionData.id]: [],
        });

        console.log('Replay mode initialized with', events.length, 'events');
      }
    }
  }, [setMessages, setSessions, setActiveSessionId, setReplayState]);

  return <>{children}</>;
};

/**
 * Agent TARS Web UI v2 - Entry Component
 *
 * Provides the Jotai atom provider and initializes theme based on user preference.
 */
export const AgentTARSWebUI: React.FC = () => {
  // Initialize theme based on user preference
  useEffect(() => {
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
        <App />
      </ReplayModeInitializer>
    </Provider>
  );
};
