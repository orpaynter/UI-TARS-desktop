import React from 'react';
import { DiffResultContentPart } from '../../../types';
import { DiffViewer } from '@/sdk/code-editor';

// Constants
const MAX_HEIGHT_CALC = 'calc(100vh - 215px)';

interface DiffResultRendererProps {
  part: DiffResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Simple and focused diff renderer
 * Only handles diff_result type with clean architecture
 */
export const DiffResultRenderer: React.FC<DiffResultRendererProps> = ({ part, onAction }) => {
  // Only handle diff_result type
  if (part.type !== 'diff_result') return null;

  const content = part.content || '';
  const fileName = part.path || 'diff';

  if (!content) return null;

  // Extract diff content from markdown code blocks if needed
  const getDiffContent = (content: string): string => {
    const codeBlockMatch = content.match(/^```(?:diff)?\n([\s\S]*?)\n```/m);
    return codeBlockMatch ? codeBlockMatch[1] : content;
  };

  const approximateSize = formatBytes(content.length);

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
