import React, { createContext, useContext, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { replayStateAtom } from '../state/atoms/replay';

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
 * ReplayModeProvider - Provides replay mode state to the application
 * 
 * This component wraps the application and provides the current replay mode status
 * to all child components through context. It detects replay mode both from
 * the global window variable and from the Jotai atom state.
 */
export const ReplayModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get replay state from atom
  const replayState = useAtomValue(replayStateAtom);
  
  // Check both the atom and global window variable for replay mode
  const isReplayMode = replayState.isActive || !!window.AGENT_TARS_REPLAY_MODE;

  return (
    <ReplayModeContext.Provider value={{ isReplayMode }}>
      {children}
    </ReplayModeContext.Provider>
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
