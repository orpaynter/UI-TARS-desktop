import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { FiCopy, FiCheck, FiInfo, FiFolder, FiGitBranch } from 'react-icons/fi';
import './MonacoCodeEditor.css';

interface DiffViewerProps {
  diffContent: string;
  fileName?: string;
  filePath?: string;
  fileSize?: string;
  maxHeight?: string;
  className?: string;
  onCopy?: () => void;
  viewMode?: 'unified' | 'split';
}

interface ParsedDiff {
  originalContent: string;
  modifiedContent: string;
  additions: number;
  deletions: number;
  hunks: number;
}

/**
 * DiffViewer component for displaying file changes with proper syntax highlighting
 *
 * Features:
 * - Unified and side-by-side diff views
 * - Proper git-style diff parsing
 * - Red/green highlighting for additions/deletions
 * - Monaco editor integration for syntax highlighting
 * - Professional diff visualization
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffContent,
  fileName,
  filePath,
  fileSize,
  maxHeight = 'none',
  className = '',
  onCopy,
  viewMode = 'unified',
}) => {
  const [copied, setCopied] = useState(false);
  const [pathCopied, setPathCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'unified' | 'split'>(viewMode);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  // Timeout refs for tooltip management
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Parse diff content manually
  const parsedDiff = useMemo((): ParsedDiff => {
    try {
      const lines = diffContent.split('\n');
      let originalContent = '';
      let modifiedContent = '';
      let additions = 0;
      let deletions = 0;
      let hunks = 0;
      let inHunk = false;

      for (const line of lines) {
        // Check for hunk header
        if (line.startsWith('@@')) {
          hunks++;
          inHunk = true;
          continue;
        }

        // Skip file headers
        if (
          line.startsWith('---') ||
          line.startsWith('+++') ||
          line.startsWith('diff ') ||
          line.startsWith('index ')
        ) {
          continue;
        }

        if (inHunk) {
          if (line.startsWith('-')) {
            originalContent += line.slice(1) + '\n';
            deletions++;
          } else if (line.startsWith('+')) {
            modifiedContent += line.slice(1) + '\n';
            additions++;
          } else if (line.startsWith(' ') || line === '') {
            // Context line
            const content = line.startsWith(' ') ? line.slice(1) : line;
            originalContent += content + '\n';
            modifiedContent += content + '\n';
          }
        }
      }

      return {
        originalContent: originalContent.trim(),
        modifiedContent: modifiedContent.trim(),
        additions,
        deletions,
        hunks,
      };
    } catch (error) {
      console.error('Failed to parse diff:', error);
      return {
        originalContent: '',
        modifiedContent: diffContent,
        additions: 0,
        deletions: 0,
        hunks: 0,
      };
    }
  }, [diffContent]);

  // Get file language from filename
  const getLanguageFromFileName = useCallback((fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
      go: 'go',
      rust: 'rust',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      php: 'php',
    };
    return languageMap[extension] || 'plaintext';
  }, []);

  // Monaco editor configuration
  const editorOptions = useMemo(
    (): editor.IStandaloneDiffEditorConstructionOptions => ({
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'none',
      selectionHighlight: false,
      occurrencesHighlight: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      renderValidationDecorations: 'off' as const,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace",
      fontSize: 13,
      lineHeight: 1.5,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      automaticLayout: true,
      renderSideBySide: currentViewMode === 'split',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    }),
    [currentViewMode],
  );

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneDiffEditor) => {
    editorRef.current = editor;
  }, []);

  // Enhanced tooltip interaction handlers
  const handleFileInfoEnter = useCallback(() => {
    if (!filePath && !fileSize) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 200);
  }, [filePath, fileSize]);

  const handleFileInfoLeave = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // Handle copy functionality
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(diffContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [diffContent, onCopy]);

  // Handle path copy functionality
  const handleCopyPath = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (filePath) {
        navigator.clipboard.writeText(filePath);
        setPathCopied(true);
        setTimeout(() => setPathCopied(false), 2000);
      }
    },
    [filePath],
  );

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setCurrentViewMode((prev) => (prev === 'unified' ? 'split' : 'unified'));
  }, []);

  const displayFileName = fileName || 'diff';
  const hasFileInfo = filePath || fileSize;
  const language = fileName ? getLanguageFromFileName(fileName) : 'plaintext';

  // Use pre-calculated stats from parsedDiff
  const stats = {
    additions: parsedDiff.additions,
    deletions: parsedDiff.deletions,
  };

  return (
    <div className={`code-editor-container ${className}`}>
      <div className="code-editor-wrapper">
        {/* IDE-style header */}
        <div className="code-editor-header">
          <div className="code-editor-header-left">
            {/* Browser-style control buttons */}
            <div className="code-editor-controls">
              <div className="code-editor-control-btn code-editor-control-red" />
              <div className="code-editor-control-btn code-editor-control-yellow" />
              <div className="code-editor-control-btn code-editor-control-green" />
            </div>

            {/* File name with tooltip */}
            <div
              className="code-editor-file-info"
              onMouseEnter={handleFileInfoEnter}
              onMouseLeave={handleFileInfoLeave}
            >
              <FiGitBranch className="mr-1" size={12} />
              <span className="code-editor-file-name">{displayFileName}</span>

              {/* Enhanced tooltip */}
              {hasFileInfo && showTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="code-editor-tooltip"
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={handleTooltipLeave}
                >
                  <div className="code-editor-tooltip-content">
                    {filePath && (
                      <div className="code-editor-tooltip-section">
                        <FiFolder className="code-editor-tooltip-icon" size={12} />
                        <div>
                          <div className="code-editor-tooltip-label">File Path</div>
                          <div className="code-editor-tooltip-value">{filePath}</div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyPath}
                            className="code-editor-tooltip-btn"
                          >
                            {pathCopied ? <FiCheck size={10} /> : <FiCopy size={10} />}
                            {pathCopied ? 'Copied!' : 'Copy Path'}
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {fileSize && (
                      <div className="code-editor-tooltip-info">
                        <FiInfo className="code-editor-tooltip-icon" size={12} />
                        <div>
                          <span className="code-editor-tooltip-label">Size: </span>
                          <span className="code-editor-tooltip-value">{fileSize}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="code-editor-tooltip-arrow" />
                </motion.div>
              )}
            </div>

            {/* Diff stats */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-400">+{stats.additions}</span>
              <span className="text-red-400">-{stats.deletions}</span>
            </div>

            {/* Language badge */}
            <div className="code-editor-language-badge">diff</div>
          </div>

          {/* Actions */}
          <div className="code-editor-actions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleViewMode}
              className="code-editor-action-btn mr-2"
              title={`Switch to ${currentViewMode === 'unified' ? 'split' : 'unified'} view`}
            >
              <span className="text-xs">{currentViewMode === 'unified' ? 'Split' : 'Unified'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="code-editor-action-btn"
              title="Copy diff"
            >
              {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
            </motion.button>
          </div>
        </div>

        {/* Monaco Diff Editor */}
        <div
          className="code-editor-monaco-container"
          style={{ height: maxHeight !== 'none' ? maxHeight : '400px' }}
        >
          <DiffEditor
            original={parsedDiff.originalContent}
            modified={parsedDiff.modifiedContent}
            language={language}
            theme="vs-dark"
            options={editorOptions}
            onMount={handleEditorDidMount}
            loading={
              <div className="flex items-center justify-center h-full bg-[#0d1117] text-gray-400">
                <div className="text-sm">Loading diff viewer...</div>
              </div>
            }
          />
        </div>

        {/* Status bar */}
        <div className="code-editor-status-bar">
          <div className="code-editor-status-left">
            <span className="code-editor-status-item">{parsedDiff.hunks} hunks</span>
            <span className="code-editor-status-item text-green-400">
              +{stats.additions} additions
            </span>
            <span className="code-editor-status-item text-red-400">
              -{stats.deletions} deletions
            </span>
          </div>
          <div className="code-editor-status-right">
            <span className="code-editor-status-item">{currentViewMode} view</span>
          </div>
        </div>
      </div>
    </div>
  );
};
