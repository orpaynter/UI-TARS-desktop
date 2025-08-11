import React, { useState } from 'react';
import { ToolResultContentPart, FileDisplayMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiExternalLink, FiFileText, FiEye, FiCode, FiImage, FiClock, FiGlobe } from 'react-icons/fi';
import { MessageContent } from './generic/components';

interface OmniTarsLinkReaderRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
  displayMode?: FileDisplayMode;
}

/**
 * Enhanced link reader renderer specifically designed for Omni TARS
 * 
 * Features:
 * - Optimized for MCP Tavily Extract data format
 * - Enhanced Markdown rendering with syntax highlighting
 * - Adaptive content display with source/rendered toggle
 * - Rich metadata display (URL, title, extraction time)
 * - Image gallery for extracted images
 * - Responsive design with improved typography
 */
export const OmniTarsLinkReaderRenderer: React.FC<OmniTarsLinkReaderRendererProps> = ({ 
  part, 
  onAction,
  displayMode: initialDisplayMode = 'rendered'
}) => {
  const [displayMode, setDisplayMode] = useState<FileDisplayMode>(initialDisplayMode);
  const [imageError, setImageError] = useState<Set<string>>(new Set());

  // Parse the data structure from Omni TARS MCP Tavily Extract
  const parseLinkReaderData = () => {
    try {
      if (typeof part.data === 'string') {
        const parsed = JSON.parse(part.data);
        return parsed;
      }
      return part.data || {};
    } catch (e) {
      console.warn('Failed to parse Omni TARS link reader data:', e);
      return { content: part.text || part.data || '' };
    }
  };

  const linkData = parseLinkReaderData();
  const content = linkData.content || linkData.text || part.text || '';
  const url = linkData.url || part.url || '';
  const title = linkData.title || part.title || '';
  const images = linkData.images || [];
  const extractTime = linkData.extract_time || linkData.response_time;
  const favicon = linkData.favicon;

  // Extract domain from URL for display
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  // Detect content language for typography optimization
  const detectLanguage = (text: string): 'zh' | 'en' | 'mixed' => {
    if (!text) return 'en';
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const totalChars = text.length;
    const chineseRatio = chineseChars ? chineseChars.length / totalChars : 0;
    
    if (chineseRatio > 0.3) return 'zh';
    if (chineseRatio > 0.1) return 'mixed';
    return 'en';
  };

  const contentLanguage = detectLanguage(content);

  // Enhanced typography classes based on content language
  const getTypographyClasses = () => {
    switch (contentLanguage) {
      case 'zh':
        return 'font-sans tracking-wide leading-relaxed';
      case 'mixed':
        return 'font-sans tracking-normal leading-relaxed';
      default:
        return 'font-sans tracking-normal leading-relaxed';
    }
  };

  const handleImageError = (imageUrl: string) => {
    setImageError(prev => new Set([...prev, imageUrl]));
  };

  const toggleDisplayMode = () => {
    const newMode = displayMode === 'rendered' ? 'source' : 'rendered';
    setDisplayMode(newMode);
    onAction?.('toggle_display_mode', { mode: newMode });
  };

  if (!content && !url) {
    return (
      <div className="text-gray-500 dark:text-gray-400 italic text-sm">
        No content available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced header with URL and metadata */}
      {url && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-slate-800/60 dark:to-slate-700/60 rounded-2xl p-5 border border-emerald-100/50 dark:border-slate-600/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Icon or Favicon */}
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex-shrink-0">
                {favicon ? (
                  <img 
                    src={favicon} 
                    alt="Site favicon" 
                    className="w-5 h-5"
                    onError={() => setImageError(prev => new Set([...prev, favicon]))}
                  />
                ) : (
                  <FiFileText className="text-emerald-600 dark:text-emerald-400" size={18} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Title */}
                {title && (
                  <h3 className={`text-gray-900 dark:text-gray-100 text-base font-semibold mb-2 ${getTypographyClasses()}`}>
                    {title}
                  </h3>
                )}
                
                {/* URL */}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/url flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  <FiGlobe size={14} />
                  <span className="text-sm font-medium truncate">{getDomain(url)}</span>
                  <FiExternalLink 
                    size={12} 
                    className="opacity-0 group-hover/url:opacity-100 transition-opacity flex-shrink-0" 
                  />
                </a>
                
                {/* Metadata */}
                {extractTime && (
                  <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <FiClock size={12} />
                    <span>Extracted in {extractTime}s</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Display mode toggle */}
            {content && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDisplayMode}
                className="flex items-center space-x-2 px-3 py-2 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-gray-200/50 dark:border-gray-600/30 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all"
              >
                {displayMode === 'rendered' ? (
                  <>
                    <FiCode size={14} />
                    <span>Source</span>
                  </>
                ) : (
                  <>
                    <FiEye size={14} />
                    <span>Rendered</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Image gallery for extracted images */}
      {images && images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FiImage size={16} />
            <span>Extracted Images ({images.length})</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl: string, index: number) => {
              if (imageError.has(imageUrl)) return null;
              
              return (
                <motion.div
                  key={`image-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                  onClick={() => window.open(imageUrl, '_blank')}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/30 group-hover:border-emerald-300/50 dark:group-hover:border-emerald-600/30 transition-colors">
                    <img
                      src={imageUrl}
                      alt={`Extracted image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={() => handleImageError(imageUrl)}
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main content area with enhanced styling */}
      {content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-slate-800/40 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 overflow-hidden"
        >
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${displayMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`${getTypographyClasses()}`}
              >
                <MessageContent
                  message={content}
                  isMarkdown={displayMode === 'rendered'}
                  displayMode={displayMode}
                  isShortMessage={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Content info footer */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {content.length.toLocaleString()} characters
                {displayMode === 'rendered' && ' • Markdown rendered'}
              </span>
              
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>View original</span>
                  <FiExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
