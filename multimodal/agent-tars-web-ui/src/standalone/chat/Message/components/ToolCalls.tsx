import React from 'react';
import { FiLoader, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ActionButton } from './ActionButton';

interface ToolCallsProps {
  toolCalls: any[];
  onToolCallClick: (toolCall: any) => void;
  getToolIcon: (name: string) => React.ReactNode;
  toolResults?: any[]; // Add toolResults to check completion status
}

/**
 * Component for displaying tool calls with loading states and status icons
 *
 * 修改以移除对 isIntermediate 的依赖，保持统一的视觉样式
 */
export const ToolCalls: React.FC<ToolCallsProps> = ({
  toolCalls,
  onToolCallClick,
  getToolIcon,
  toolResults = [],
}) => {
  // Helper function to get tool call status
  const getToolCallStatus = (toolCall: any) => {
    const result = toolResults.find((result) => result.toolCallId === toolCall.id);

    if (!result) {
      return 'pending'; // No result yet, tool is still running
    }

    if (result.error) {
      return 'error'; // Tool execution failed
    }

    return 'success'; // Tool completed successfully
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <FiLoader size={10} className="text-slate-500 dark:text-slate-400" />
          </motion.div>
        );
      case 'success':
        return <FiCheck size={10} className="text-slate-600 dark:text-slate-300" />;
      case 'error':
        return <FiX size={10} className="text-red-600 dark:text-red-400" />;
      default:
        return <FiClock size={10} className="text-slate-500 dark:text-slate-400" />;
    }
  };

  // 生成工具描述文本
  const getToolDescription = (toolCall: any) => {
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}');

      switch (toolCall.function.name) {
        case 'web_search':
          return args.query ? `"${args.query}"` : '';
        case 'browser_navigate':
          return args.url ? args.url : '';
        case 'browser_vision_control':
          return args.action ?? '';
        case 'list_directory':
          return args.path ?? '';
        case 'run_command':
          return args.command ?? '';
      }
    } catch (error) {
      console.error('Failed to parse tool arguments:', error);
      return '';
    }
  };

  // 获取浏览器操作结果说明
  const getResultInfo = (toolCall: any, status: string) => {
    const result = toolResults.find((result) => result.toolCallId === toolCall.id);

    if (status === 'error' && result?.error) {
      return '"operation failed"';
    } else if (status === 'success') {
      if (toolCall.function.name === 'browser_get_markdown') {
        return '"get content successfully"';
      } else if (toolCall.function.name === 'browser_navigate') {
        return '"navigation success"';
      }
    }

    return '';
  };

  return (
    <div className="mt-2 space-y-1.5">
      {toolCalls.map((toolCall) => {
        const status = getToolCallStatus(toolCall) as 'pending' | 'success' | 'error';
        const description = getToolDescription(toolCall);
        const browserInfo = getResultInfo(toolCall, status);

        return (
          <ActionButton
            key={toolCall.id}
            icon={getToolIcon(toolCall.function.name)}
            label={toolCall.function.name}
            onClick={() => onToolCallClick(toolCall)}
            status={status}
            statusIcon={getStatusIcon(status)}
            description={description || browserInfo || undefined}
          />
        );
      })}
    </div>
  );
};
