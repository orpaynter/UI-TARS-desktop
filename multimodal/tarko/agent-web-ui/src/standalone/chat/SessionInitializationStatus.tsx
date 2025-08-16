import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLoader, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { SessionInitializationStatus } from '@/common/state/atoms/session';

interface SessionInitializationStatusProps {
  status: SessionInitializationStatus;
  sessionId: string;
}

/**
 * Component to display session initialization progress
 */
export const SessionInitializationStatusComponent: React.FC<SessionInitializationStatusProps> = ({
  status,
  sessionId,
}) => {
  if (!status.isInitializing && status.events.length === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (status.isInitializing) {
      return <FiLoader className="animate-spin text-blue-500" size={16} />;
    }

    const lastEvent = status.events[status.events.length - 1];
    if (lastEvent?.type === 'error') {
      return <FiAlertCircle className="text-red-500" size={16} />;
    }

    if (lastEvent?.type === 'completed') {
      return <FiCheckCircle className="text-green-500" size={16} />;
    }

    return <FiClock className="text-gray-500" size={16} />;
  };

  const getStatusColor = () => {
    if (status.isInitializing) return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    
    const lastEvent = status.events[status.events.length - 1];
    if (lastEvent?.type === 'error') {
      return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    }
    
    if (lastEvent?.type === 'completed') {
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    }
    
    return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={`mx-4 mb-4 p-4 rounded-xl border ${getStatusColor()}`}
      >
        <div className="flex items-center gap-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {status.isInitializing ? 'Agent Initializing' : 'Initialization Complete'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {status.message}
            </p>
          </div>
        </div>

        {/* Event Log */}
        {status.events.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Log:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {status.events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="text-gray-400 dark:text-gray-500 font-mono min-w-0 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="flex-1 text-gray-600 dark:text-gray-400">
                    {event.message}
                    {event.error && (
                      <span className="text-red-500 dark:text-red-400 block mt-1">
                        Error: {event.error}
                      </span>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progress indicator for initializing sessions */}
        {status.isInitializing && (
          <div className="mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <motion.div
                  className="bg-blue-500 h-1.5 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
              <span>Setting up MCP servers...</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
