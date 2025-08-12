import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiExternalLink, FiEye, FiCode, FiCopy, FiCheck } from 'react-icons/fi';
import { ToolResultContentPart } from '../types';
import { MarkdownRenderer } from '@/sdk/markdown-renderer';
import { SearchService } from '@/common/services/SearchService';

interface LinkReaderRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: unknown) => void;
}

type ViewMode = 'summary' | 'full' | 'raw';

interface LinkResult {
  url: string;
  title: string;
  snippet: string;
  fullContent: string;
}

/**
 * Specialized renderer for LinkReader tool results
 * Provides better handling of long content with multiple view modes
 */
export const LinkReaderRenderer: React.FC<LinkReaderRendererProps> = ({ part, onAction }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [copiedStates, setCopiedStates] = useState<Set<number>>(new Set());

  // Extract search data from the part
  const searchData = SearchService.extractSearchData(part);

  if (!searchData || !searchData.results || searchData.results.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm italic">
        No link content available
      </div>
    );
  }

  // Extract full content from raw data if available
  const getFullContent = (index: number): string => {
    try {
      if (Array.isArray(part.data) && part.data[0] && typeof part.data[0] === 'object' && 'text' in part.data[0]) {
        const parsed = JSON.parse(part.data[0].text as string);
        return parsed.results?.[index]?.raw_content || '';
      }
      if (typeof part.text === 'string') {
        const parsed = JSON.parse(part.text);
        return parsed.results?.[index]?.raw_content || '';
      }
    } catch (error) {
      console.warn('Failed to extract full content:', error);
    }
    return '';
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const copyContent = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates(prev => new Set([...prev, index]));
      setTimeout(() => {
        setCopiedStates(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const linkResults: LinkResult[] = searchData.results.map((result, index) => ({
    url: result.url,
    title: result.title,
    snippet: result.snippet,
    fullContent: getFullContent(index),
  }));

  const renderContent = (content: string, isExpanded: boolean) => {
    if (!isExpanded) {
      return (
        <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {content}
        </div>
      );
    }

    // For full content, provide better formatting
    const isLikelyMarkdown = /^#+\s|\[.+\]\(|\*\*.+\*\*|```/.test(content);
    
    if (isLikelyMarkdown && viewMode !== 'raw') {
      return (
        <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <MarkdownRenderer content={content} className="prose dark:prose-invert prose-sm max-w-none" />
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words font-mono">
          {content}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with view mode controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Link Content
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({linkResults.length} {linkResults.length === 1 ? 'result' : 'results'})
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'summary'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode('full')}
            className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
              viewMode === 'full'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <FiEye size={12} />
            Full
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
              viewMode === 'raw'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <FiCode size={12} />
            Raw
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {linkResults.map((result, index) => {
          const isExpanded = expandedResults.has(index);
          const isCopied = copiedStates.has(index);
          const contentToShow = viewMode === 'summary' ? result.snippet : result.fullContent;

          return (
            <motion.div
              key={`link-result-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50"
            >
              {/* Result header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.title}
                    </h4>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <span className="truncate">{result.url}</span>
                      <FiExternalLink size={12} className="flex-shrink-0" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {viewMode !== 'summary' && result.fullContent && (
                      <button
                        onClick={() => copyContent(result.fullContent, index)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Copy content"
                      >
                        {isCopied ? (
                          <FiCheck size={14} className="text-green-500" />
                        ) : (
                          <FiCopy size={14} />
                        )}
                      </button>
                    )}
                    
                    {viewMode !== 'summary' && result.fullContent && (
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {viewMode === 'summary' ? (
                    <motion.div
                      key="summary-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      {result.snippet}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="full-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {renderContent(contentToShow, isExpanded)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
