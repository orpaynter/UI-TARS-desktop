import React from 'react';
import { ToolResultContentPart } from '../types';
import { motion } from 'framer-motion';
import { FiExternalLink, FiSearch, FiInfo, FiGlobe, FiClock } from 'react-icons/fi';

interface OmniTarsSearchRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Enhanced search result renderer specifically designed for Omni TARS
 * 
 * Features:
 * - Optimized for MCP Google Search data format
 * - Enhanced multilingual support with adaptive typography
 * - Improved visual hierarchy and spacing
 * - Subtle animations and micro-interactions
 * - Better accessibility and responsive design
 */
export const OmniTarsSearchRenderer: React.FC<OmniTarsSearchRendererProps> = ({ part }) => {
  // Parse the data structure from Omni TARS MCP Google Search
  const parseSearchData = () => {
    try {
      // Handle different data formats
      if (typeof part.data === 'string') {
        const parsed = JSON.parse(part.data);
        return parsed;
      }
      return part.data || {};
    } catch (e) {
      console.warn('Failed to parse Omni TARS search data:', e);
      return {};
    }
  };

  const searchData = parseSearchData();
  const results = searchData.results || searchData.organic_results || [];
  const query = searchData.query || searchData.search_query || part.query;
  const searchTime = searchData.search_time || searchData.response_time;
  const totalResults = searchData.total_results || searchData.results_count;

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

  const queryLanguage = detectLanguage(query || '');

  // Enhanced typography classes based on content language
  const getTypographyClasses = (text: string, isTitle = false) => {
    const lang = detectLanguage(text);
    const baseClasses = isTitle 
      ? 'font-medium leading-tight'
      : 'leading-relaxed';
    
    switch (lang) {
      case 'zh':
        return `${baseClasses} font-sans tracking-wide`;
      case 'mixed':
        return `${baseClasses} font-sans tracking-normal`;
      default:
        return `${baseClasses} font-sans tracking-normal`;
    }
  };

  if (!results || !Array.isArray(results)) {
    return (
      <div className="text-gray-500 dark:text-gray-400 italic text-sm">
        No search results available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced search header with metadata */}
      {query && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/60 dark:to-slate-700/60 rounded-2xl p-5 border border-blue-100/50 dark:border-slate-600/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FiSearch className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-gray-900 dark:text-gray-100 text-base ${getTypographyClasses(query, true)}`}>
                  {query}
                </h3>
                {(totalResults || searchTime) && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {totalResults && (
                      <span className="flex items-center space-x-1">
                        <FiInfo size={12} />
                        <span>{totalResults.toLocaleString()} results</span>
                      </span>
                    )}
                    {searchTime && (
                      <span className="flex items-center space-x-1">
                        <FiClock size={12} />
                        <span>{searchTime}s</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* No results state with enhanced design */}
      {results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-50/80 dark:bg-slate-800/60 rounded-2xl p-8 text-center border border-gray-200/50 dark:border-gray-700/30"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <FiInfo className="text-gray-400 dark:text-gray-500" size={28} />
          </div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-lg">
            No Results Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Try adjusting your search terms or using different keywords to find what you're looking for.
          </p>
        </motion.div>
      )}

      {/* Enhanced results list with improved visual design */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result: any, index: number) => {
            const title = result.title || result.name || 'Untitled';
            const url = result.url || result.link || '#';
            const snippet = result.snippet || result.description || '';
            const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
            
            return (
              <motion.div
                key={`search-result-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="bg-white/80 dark:bg-slate-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden transition-all duration-300 hover:border-blue-200/80 dark:hover:border-blue-700/50 hover:shadow-lg hover:shadow-blue-100/20 dark:hover:shadow-blue-900/10">
                  <div className="p-6">
                    {/* Result header with enhanced title and URL */}
                    <div className="mb-4">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link block"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={`text-gray-900 dark:text-gray-100 text-lg group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors duration-200 flex-1 mr-3 ${getTypographyClasses(title, true)}`}>
                            <span className="mr-3 text-sm font-normal text-gray-400 dark:text-gray-500">
                              {index + 1}.
                            </span>
                            {title}
                          </h3>
                          <FiExternalLink
                            className="text-gray-400 dark:text-gray-500 opacity-0 group-hover/link:opacity-100 transition-all duration-200 flex-shrink-0 mt-1"
                            size={16}
                          />
                        </div>
                        
                        {/* Enhanced URL display */}
                        <div className="flex items-center text-xs text-green-600 dark:text-green-400 mb-3">
                          <FiGlobe size={12} className="mr-2 flex-shrink-0" />
                          <span className="truncate font-medium">{displayUrl}</span>
                        </div>
                      </a>
                    </div>

                    {/* Enhanced snippet with better typography */}
                    {snippet && (
                      <div 
                        className={`text-gray-600 dark:text-gray-300 text-sm ${getTypographyClasses(snippet)}`}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {snippet}
                      </div>
                    )}
                  </div>
                  
                  {/* Subtle bottom accent */}
                  <div className="h-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Results summary footer */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {results.length} result{results.length !== 1 ? 's' : ''}
            {totalResults && totalResults > results.length && ` of ${totalResults.toLocaleString()}`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
