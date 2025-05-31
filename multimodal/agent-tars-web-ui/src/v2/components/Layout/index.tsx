import React from 'react';
import { Sidebar } from '../Sidebar';
import { ChatPanel } from '../Chat/ChatPanel';
import { WorkspacePanel } from '../Workspace/WorkspacePanel';
import { useLayout } from '../../hooks/useLayout';
import { useSession } from '../../hooks/useSession';
import { motion } from 'framer-motion';
import { Shell } from '../Common/Shell';
import './Layout.css';

interface LayoutProps {
  isReplayMode?: boolean;
}

/**
 * Layout Component - Main application layout
 *
 * Design principles:
 * - Clean, minimalist aesthetic with refined borders and subtle shadows
 * - Neutral color palette with elegant accent colors
 * - Consistent spacing and typography for optimal readability
 * - Seamless visual flow between different interface elements
 */
export const Layout: React.FC<LayoutProps> = ({ isReplayMode = false }) => {
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const { connectionStatus } = useSession();

  return (
    <div className="flex h-screen bg-[#F2F3F5] dark:bg-white/5 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* 在回放模式下不显示侧边栏 */}
      {!isReplayMode && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden p-3 lg:p-4 lg:pl-1">
        {/* 在回放模式下显示标题栏 */}
        {isReplayMode && (
          <div className="mb-3 p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl border border-[#E5E6EC] dark:border-gray-700/30 flex items-center">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 font-bold mr-3 text-base">
              A
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-xl">Agent TARS</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Shared Conversation (Replay Mode)
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 h-full">
          {/* Chat panel */}
          <motion.div layout className="w-[40%]">
            <Shell className="h-full rounded-3xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-[#E5E6EC] dark:border-none bg-[#FFFFFFE5] dark:shadow-gray-950/5">
              <ChatPanel />
            </Shell>
          </motion.div>

          {/* Workspace panel */}
          <motion.div layout className="w-[60%]">
            <Shell className="h-full rounded-3xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-[#E5E6EC] dark:border-none bg-[#FFFFFFE5] dark:shadow-gray-950/5">
              <WorkspacePanel />
            </Shell>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
