import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { useSession } from '../hooks/useSession';
import HomePage from './Router/HomePage';
import { useAtomValue } from 'jotai';
import { replayStateAtom } from '../state/atoms/replay';
import { useReplayMode } from '../context/ReplayModeContext';

/**
 * Session Route Component - Handles session-specific routes
 */
const SessionRoute: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { setActiveSession, connectionStatus, loadSessions } = useSession();
  const location = useLocation();
  const replayState = useAtomValue(replayStateAtom);
  const isReplayMode = useReplayMode();

  // Set active session based on route parameter - but not in replay mode
  useEffect(() => {
    if (sessionId && connectionStatus.connected && !isReplayMode) {
      setActiveSession(sessionId).catch((error) => {
        console.error(`Failed to load session ${sessionId}:`, error);
      });
    }
  }, [sessionId, connectionStatus.connected, setActiveSession, isReplayMode]);

  // Process query parameter if present - skip in replay mode
  useEffect(() => {
    if (isReplayMode) return;
    
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    // If there's a query in the URL, process it
    if (query && sessionId) {
      // Remove the query parameter from the URL
      const navigate = useNavigate();
      navigate(`/${sessionId}`, { replace: true });
    }
  }, [location, sessionId, isReplayMode]);

  return <Layout />;
};

/**
 * App Component - Main application container with routing
 */
export const App: React.FC = () => {
  const { initConnectionMonitoring, loadSessions, connectionStatus } = useSession();
  const isReplayMode = useReplayMode();

  // Initialize connection monitoring and load sessions on mount - but not in replay mode
  useEffect(() => {
    // In replay mode, skip connection monitoring and session loading
    if (isReplayMode) {
      console.log('[ReplayMode] Skipping connection initialization in replay mode');
      return;
    }

    const initialize = async () => {
      // Initialize connection monitoring
      const cleanup = initConnectionMonitoring();

      // Load sessions if connected
      if (connectionStatus.connected) {
        await loadSessions();
      }

      return cleanup;
    };

    const cleanupPromise = initialize();

    // Cleanup on unmount
    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, [initConnectionMonitoring, loadSessions, connectionStatus.connected, isReplayMode]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:sessionId" element={<SessionRoute />} />
    </Routes>
  );
};
