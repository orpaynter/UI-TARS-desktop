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
  // Handle both file_result and json types (edit_file can come as either)
  if (part.type !== 'file_result' && part.type !== 'json') return null;

  // Extract content from different data structures
  let content = '';
  let fileName = 'diff';

  if (part.type === 'file_result') {
    content = part.content || '';
    fileName = part.path ? part.path.split('/').pop() || part.path : 'diff';
  } else if (part.type === 'json' && Array.isArray(part.data)) {
    // Handle JSON_DATA structure from edit_file
    const textItem = part.data.find(
      (item: any) => item.type === 'text' && item.name === 'JSON_DATA',
    );
    if (textItem && typeof textItem.text === 'string') {
      content = textItem.text;
      // Try to extract filename from diff content
      const fileMatch = content.match(/\+\+\+ b\/(.+?)\n/);
      if (fileMatch) {
        fileName = fileMatch[1].split('/').pop() || fileMatch[1];
      }
    }
  }

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
