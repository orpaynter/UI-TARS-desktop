import React from 'react';
import { ToolResultContentPart } from '../../../types';
import { DiffViewer } from '@/sdk/code-editor';

// Constants
const MAX_HEIGHT_CALC = 'calc(100vh - 215px)';

interface DiffResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Dedicated renderer for edit_file tool results with diff content
 * Provides clean separation from FileResultRenderer
 */
export const DiffResultRenderer: React.FC<DiffResultRendererProps> = ({ part, onAction }) => {
  // Only render for file results with diff content
  if (part.type !== 'file_result') return null;

  const content = part.content || '';
  const fileName = part.path ? part.path.split('/').pop() || part.path : 'diff';

  // Extract diff content from markdown code blocks if needed
  const getDiffContent = (content: string): string => {
    const codeBlockMatch = content.match(/^```(?:diff)?\n([\s\S]*?)\n```/m);
    return codeBlockMatch ? codeBlockMatch[1] : content;
  };

  const approximateSize =
    typeof content === 'string' ? formatBytes(content.length) : 'Unknown size';

  // Handle file download
  const handleDownload = () => {
    const diffContent = getDiffContent(content);
    const blob = new Blob([diffContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.diff`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format file size helper
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden">
        <div className="p-0">
          <DiffViewer
            diffContent={getDiffContent(content)}
            fileName={fileName}
            maxHeight={MAX_HEIGHT_CALC}
            className="rounded-none border-0"
            onCopy={handleDownload}
          />
        </div>
      </div>
    </div>
  );
};
