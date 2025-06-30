import { useState, useEffect, useRef } from 'react';

interface AnimatedMarkdownOptions {
  /**
   * Whether animation is enabled
   */
  enabled?: boolean;

  /**
   * Content to check for changes
   */
  content: string;

  /**
   * Delay before starting animation
   */
  startDelay?: number;

  /**
   * Duration of animation effect
   */
  animationDuration?: number;
}

interface AnimationState {
  shouldAnimate: boolean;
  previousContentLength: number;
  currentContentLength: number;
  isIncremental: boolean;
}

/**
 * Hook to control animated markdown rendering with intelligent diffing
 * to prevent flashing and handle incremental content updates smoothly
 */
export function useAnimatedMarkdown({
  enabled = true,
  content,
  startDelay = 10,
  animationDuration = 1500,
}: AnimatedMarkdownOptions): AnimationState {
  // Track animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    shouldAnimate: false,
    previousContentLength: 0,
    currentContentLength: 0,
    isIncremental: false,
  });

  // Keep track of previous content for diffing
  const prevContentRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate content metrics
  const currentLength = content.trim().length;
  const previousLength = prevContentRef.current.trim().length;
  const isIncremental = currentLength > previousLength && previousLength > 0;
  const hasContentChanged = prevContentRef.current.trim() !== content.trim();

  // Main effect to handle content changes and animation timing
  useEffect(() => {
    // Skip if animations are disabled
    if (!enabled) {
      prevContentRef.current = content;
      setAnimationState({
        shouldAnimate: false,
        previousContentLength: currentLength,
        currentContentLength: currentLength,
        isIncremental: false,
      });
      return;
    }

    // Skip animation on initial mount with existing content
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (content.trim()) {
        prevContentRef.current = content;
        setAnimationState({
          shouldAnimate: false,
          previousContentLength: currentLength,
          currentContentLength: currentLength,
          isIncremental: false,
        });
        return;
      }
    }

    // Only animate if content has meaningfully changed and we have content
    if (hasContentChanged && content.trim() !== '') {
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Set up animation state for incremental updates
      const newAnimationState: AnimationState = {
        shouldAnimate: true,
        previousContentLength: previousLength,
        currentContentLength: currentLength,
        isIncremental: isIncremental,
      };

      // Update content reference immediately to prevent re-triggering
      const oldContent = prevContentRef.current;
      prevContentRef.current = content;

      // Start animation after short delay
      const initialTimer = setTimeout(() => {
        setAnimationState(newAnimationState);

        // Auto-complete animation after duration
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationState((prev) => ({
            ...prev,
            shouldAnimate: false,
          }));
        }, animationDuration);
      }, startDelay);

      return () => {
        clearTimeout(initialTimer);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }
  }, [
    content,
    enabled,
    startDelay,
    animationDuration,
    hasContentChanged,
    currentLength,
    previousLength,
    isIncremental,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return animationState;
}
