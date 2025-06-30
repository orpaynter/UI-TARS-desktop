import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MarkdownCMD, Markdown as DsMarkdown, MarkdownCMDRef } from 'ds-markdown';
import 'ds-markdown/style.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  forceDarkTheme?: boolean;
}

/**
 * Optimized Markdown Renderer with anti-flicker streaming detection
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  forceDarkTheme = false,
}) => {
  const markdownCmdRef = useRef<MarkdownCMDRef>(null);
  const dsMarkdownRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Streaming detection state
  const lastUpdateRef = useRef<{ content: string; timestamp: number }>({
    content: '',
    timestamp: 0,
  });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [streamingState, setStreamingState] = useState<{
    isStreaming: boolean;
    useCommandMode: boolean;
    lastProcessedLength: number;
    stable: boolean; // Add stability flag
  }>({
    isStreaming: false,
    useCommandMode: false,
    lastProcessedLength: 0,
    stable: true,
  });

  /**
   * Enhanced streaming detection with debounce
   */
  const detectStreaming = useCallback((newContent: string): boolean => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current;

    // Check for incremental update pattern
    const isIncremental =
      lastUpdate.content.length > 0 &&
      newContent.startsWith(lastUpdate.content) &&
      newContent.length > lastUpdate.content.length;

    const timeDiff = now - lastUpdate.timestamp;
    const isWithinStreamWindow = timeDiff < 3000; // 3 seconds window

    const shouldStream = isIncremental && isWithinStreamWindow;

    // Update reference
    lastUpdateRef.current = { content: newContent, timestamp: now };

    return shouldStream;
  }, []);

  /**
   * Debounced mode stabilization
   */
  const stabilizeMode = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setStreamingState((prev) => ({ ...prev, stable: true }));
    }, 100); // 100ms stabilization period
  }, []);

  /**
   * Handle content updates with anti-flicker logic
   */
  useEffect(() => {
    if (!content) {
      // Clear content when empty
      if (streamingState.useCommandMode) {
        markdownCmdRef.current?.clear();
      }
      setStreamingState({
        isStreaming: false,
        useCommandMode: false,
        lastProcessedLength: 0,
        stable: true,
      });
      lastUpdateRef.current = { content: '', timestamp: 0 };
      return;
    }

    const shouldStream = detectStreaming(content);
    const currentMode = streamingState.useCommandMode;

    // Determine target mode
    let targetMode = currentMode;
    if (shouldStream && !currentMode) {
      // Switch to streaming mode
      targetMode = true;
    } else if (!shouldStream && currentMode && streamingState.stable) {
      // Only switch away from streaming when stable
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current.timestamp;
      if (timeSinceLastUpdate > 1000) {
        // 1 second grace period
        targetMode = false;
      }
    }

    // Apply mode change if needed
    if (targetMode !== currentMode) {
      setStreamingState((prev) => ({
        ...prev,
        useCommandMode: targetMode,
        stable: false,
        isStreaming: shouldStream && targetMode,
        lastProcessedLength: targetMode ? prev.lastProcessedLength : 0,
      }));

      stabilizeMode();

      if (targetMode) {
        // Switch to command mode
        setTimeout(() => {
          markdownCmdRef.current?.clear();
          markdownCmdRef.current?.push(content, 'answer');
        }, 0);
      }
    } else if (targetMode && shouldStream) {
      // Continue streaming in command mode
      const lastLength = streamingState.lastProcessedLength;
      const newContent = content.slice(lastLength);

      if (newContent && newContent.length > 0) {
        markdownCmdRef.current?.push(newContent, 'answer');
        setStreamingState((prev) => ({
          ...prev,
          lastProcessedLength: content.length,
          isStreaming: true,
        }));
      }
    } else if (targetMode && !shouldStream && streamingState.stable) {
      // Ensure final content is complete
      setStreamingState((prev) => ({
        ...prev,
        isStreaming: false,
        lastProcessedLength: content.length,
      }));
    }
  }, [
    content,
    detectStreaming,
    streamingState.useCommandMode,
    streamingState.lastProcessedLength,
    streamingState.stable,
    stabilizeMode,
  ]);

  /**
   * Handle streaming end
   */
  const handleStreamingEnd = useCallback(() => {
    setStreamingState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  /**
   * Update container streaming indicator
   */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-streaming', streamingState.isStreaming.toString());
    }
  }, [streamingState.isStreaming]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const theme = forceDarkTheme ? 'dark' : 'light';

  // Render appropriate component based on stable mode
  if (streamingState.useCommandMode) {
    return (
      <div
        ref={containerRef}
        className={`markdown-renderer-cmd ${className}`}
        data-streaming={streamingState.isStreaming}
      >
        <MarkdownCMD
          ref={markdownCmdRef}
          theme={theme}
          interval={15}
          timerType="requestAnimationFrame"
          autoStartTyping={true}
          disableTyping={!streamingState.isStreaming}
          onEnd={handleStreamingEnd}
        />
      </div>
    );
  }

  // Static mode
  return (
    <div className={`markdown-renderer-static ${className}`}>
      <DsMarkdown
        ref={dsMarkdownRef}
        theme={theme}
        interval={20}
        timerType="requestAnimationFrame"
        disableTyping={true}
        autoStartTyping={false}
      >
        {content}
      </DsMarkdown>
    </div>
  );
};
