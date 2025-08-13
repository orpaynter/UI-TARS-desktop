import React, { useMemo, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { FiCopy, FiCheck, FiGitBranch } from 'react-icons/fi';
import './MonacoCodeEditor.css';

interface DiffViewerProps {
  diffContent: string;
  fileName?: string;
  maxHeight?: string;
  className?: string;
  viewMode?: 'unified' | 'split';
  onCopy?: () => void;
}

// Simplified diff parser
function parseDiff(diffContent: string) {
  const lines = diffContent.split('\n');
  let original = '';
  let modified = '';
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (
      line.startsWith('@@') ||
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('diff ') ||
      line.startsWith('index ')
    ) {
      continue;
    }

    if (line.startsWith('-')) {
      original += line.slice(1) + '\n';
      deletions++;
    } else if (line.startsWith('+')) {
      modified += line.slice(1) + '\n';
      additions++;
    } else if (line.startsWith(' ') || line === '') {
      const content = line.startsWith(' ') ? line.slice(1) : line;
      original += content + '\n';
      modified += content + '\n';
    }
  }

  return { original: original.trim(), modified: modified.trim(), additions, deletions };
}

// Monaco editor default configuration
const DEFAULT_EDITOR_OPTIONS: editor.IStandaloneDiffEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderSideBySide: false, // Default unified view
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 13,
  automaticLayout: true,
};

/**
 * Simplified Diff Viewer component
 * - Removed complex tooltip logic
 * - Simplified state management
 * - Retained core functionality: diff display, copy, view toggle
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffContent,
  fileName = 'diff',
  maxHeight = '400px',
  className = '',
  viewMode = 'unified',
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  // Parse diff content
  const { original, modified, additions, deletions } = useMemo(
    () => parseDiff(diffContent),
    [diffContent],
  );

  // Get file language
  const language = useMemo(() => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext] || 'plaintext';
  }, [fileName]);

  // Editor configuration
  const editorOptions = useMemo(
    () => ({ ...DEFAULT_EDITOR_OPTIONS, renderSideBySide: currentViewMode === 'split' }),
    [currentViewMode],
  );

  // Copy functionality
  const handleCopy = () => {
    navigator.clipboard.writeText(diffContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setCurrentViewMode((prev) => (prev === 'unified' ? 'split' : 'unified'));
  };

  return (
    <div className={`code-editor-container ${className}`}>
      <div className="code-editor-wrapper">
        {/* Simplified header */}
        <div className="code-editor-header">
          <div className="code-editor-header-left">
            <div className="code-editor-controls">
              <div className="code-editor-control-btn code-editor-control-red" />
              <div className="code-editor-control-btn code-editor-control-yellow" />
              <div className="code-editor-control-btn code-editor-control-green" />
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <FiGitBranch className="mr-1" size={12} />
                <span className="code-editor-file-name">{fileName}</span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-green-400">+{additions}</span>
                <span className="text-red-400">-{deletions}</span>
              </div>
            </div>
          </div>

          <div className="code-editor-actions">
            <button
              onClick={toggleViewMode}
              className="code-editor-action-btn mr-2 text-xs"
              title={`Switch to ${currentViewMode === 'unified' ? 'split' : 'unified'} view`}
            >
              {currentViewMode === 'unified' ? 'Split' : 'Unified'}
            </button>

            <button onClick={handleCopy} className="code-editor-action-btn" title="Copy diff">
              {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>

        {/* Diff editor */}
        <div className="code-editor-monaco-container" style={{ height: maxHeight }}>
          <DiffEditor
            original={original}
            modified={modified}
            language={language}
            theme="vs-dark"
            options={editorOptions}
            loading={
              <div className="flex items-center justify-center h-full bg-[#0d1117] text-gray-400">
                <div className="text-sm">Loading diff viewer...</div>
              </div>
            }
          />
        </div>

        {/* Simplified status bar */}
        <div className="code-editor-status-bar">
          <div className="code-editor-status-left">
            <span className="code-editor-status-item text-green-400">+{additions}</span>
            <span className="code-editor-status-item text-red-400">-{deletions}</span>
          </div>
          <div className="code-editor-status-right">
            <span className="code-editor-status-item">{currentViewMode} view</span>
          </div>
        </div>
      </div>
    </div>
  );
};
