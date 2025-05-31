import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { useSession } from '../hooks/useSession';
import HomePage from './Router/HomePage';
import { useAtomValue } from 'jotai';
import { replayStateAtom } from '../state/atoms/replay';

/**
 * Session Route Component - Handles session-specific routes
 */
const SessionRoute: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { setActiveSession, connectionStatus, loadSessions } = useSession();
  const location = useLocation();
  const replayState = useAtomValue(replayStateAtom);

  // Set active session based on route parameter - 但在回放模式下不执行
  useEffect(() => {
    if (sessionId && connectionStatus.connected && !replayState.isActive) {
      setActiveSession(sessionId).catch((error) => {
        console.error(`Failed to load session ${sessionId}:`, error);
      });
    }
  }, [sessionId, connectionStatus.connected, setActiveSession, replayState.isActive]);

  // Process query parameter if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    // If there's a query in the URL, process it
    if (query && sessionId) {
      // Remove the query parameter from the URL
      const navigate = useNavigate();
      navigate(`/${sessionId}`, { replace: true });
    }
  }, [location, sessionId]);

  return <Layout isReplayMode={replayState.isActive} />;
};

/**
 * App Component - Main application container with routing
 */
export const App: React.FC = () => {
  const { initConnectionMonitoring, loadSessions, connectionStatus } = useSession();
  const replayState = useAtomValue(replayStateAtom);

  // Initialize connection monitoring and load sessions on mount - 但在回放模式下不执行
  useEffect(() => {
    // 在回放模式下跳过连接监控和会话加载
    if (replayState.isActive) {
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
  }, [initConnectionMonitoring, loadSessions, connectionStatus.connected, replayState.isActive]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:sessionId" element={<SessionRoute />} />
    </Routes>
  );
};
