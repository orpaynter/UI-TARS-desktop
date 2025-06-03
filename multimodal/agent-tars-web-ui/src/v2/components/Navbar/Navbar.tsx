import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiShare2 } from 'react-icons/fi';
import { useLayout } from '../../hooks/useLayout';
import { useSession } from '../../hooks/useSession';
import { ShareButton } from '../Share';
import './Navbar.css';

/**
 * Navbar Component - Global navigation bar in IDE style
 * 
 * Design principles:
 * - Clean, minimal interface that fits modern IDE aesthetics
 * - Centralized location for global actions and status display
 * - Adaptive layout that works in both normal and replay modes
 * - Consistent visual language with the rest of the application
 */
export const Navbar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const { activeSessionId, isProcessing, modelInfo } = useSession();
  
  return (
    <div className="h-12 border-b border-gray-100/40 dark:border-gray-700/20 backdrop-blur-sm flex items-center justify-between px-3">
      {/* Left section */}
      <div className="flex items-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-full transition-colors"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </motion.button>
      </div>
      
      {/* Center section - Model info */}
      <div className="flex items-center">
        {modelInfo.model && (
          <div className="px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-700/80 text-xs text-gray-700 dark:text-gray-300 border border-gray-200/40 dark:border-gray-700/30 flex items-center">
            <div className="w-4 h-4 rounded-full bg-purple-400 dark:bg-purple-500 mr-2 flex-shrink-0"></div>
            <span className="font-mono">{modelInfo.model}</span>
            {modelInfo.provider && (
              <span className="ml-2 px-1.5 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-600/80 text-gray-600 dark:text-gray-400 text-[10px]">
                {modelInfo.provider}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Right section */}
      <div className="flex items-center">
        {activeSessionId && !isProcessing && <ShareButton variant="navbar" />}
      </div>
    </div>
  );
};
