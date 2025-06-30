import type { Element, Root, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

interface AnimateTextOptions {
  /**
   * CSS animation class to apply to each text span
   */
  animationClass?: string;

  /**
   * Elements to apply the animation to
   */
  elements?: string[];

  /**
   * Whether to split by words or characters
   */
  granularity?: 'word' | 'character';

  /**
   * Staggered delay increment between each element (in milliseconds)
   */
  staggerDelay?: number;

  /**
   * Maximum delay to apply (prevents excessive delays for long content)
   */
  maxDelay?: number;

  /**
   * Previous content length to calculate incremental animation
   */
  previousContentLength?: number;

  /**
   * Current content length for comparison
   */
  currentContentLength?: number;
}

/**
 * Rehype plugin that splits text nodes into individual spans with animation classes
 * for creating streaming text effects. Optimized to prevent flickering and handle
 * incremental content updates smoothly with precise sequential timing.
 */
export function rehypeAnimateText(options: AnimateTextOptions = {}) {
  const {
    animationClass = 'animate-fade-in',
    elements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'strong'],
    granularity = 'word',
    staggerDelay = 30,
    maxDelay = 2000,
    previousContentLength = 0,
    currentContentLength = 0,
  } = options;

  return (tree: Root) => {
    let globalSpanIndex = 0;
    let totalProcessedCharacters = 0;

    // Calculate the starting point based on previous content length
    const previousWordCount = Math.floor(previousContentLength / (granularity === 'word' ? 5 : 1));

    visit(tree, 'element', (node) => {
      if (elements.includes(node.tagName) && node.children) {
        const newChildren: Array<ElementContent> = [];

        node.children.forEach((child) => {
          if (child.type === 'text') {
            let textParts: string[];

            // Split text based on granularity
            if (granularity === 'word') {
              // Use Intl.Segmenter for proper word splitting when available
              if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
                try {
                  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
                  const segments = segmenter.segment(child.value);
                  textParts = Array.from(segments)
                    .map((segment) => segment.segment)
                    .filter(Boolean);
                } catch (e) {
                  // Fallback if Segmenter is not supported or fails
                  textParts = child.value.split(/(\s+)/).filter(Boolean);
                }
              } else {
                // Fallback for browsers without Segmenter
                textParts = child.value.split(/(\s+)/).filter(Boolean);
              }
            } else {
              // Character granularity
              textParts = child.value.split('');
            }

            textParts.forEach((part) => {
              // Skip animation for whitespace to avoid awkward pauses
              const isWhitespace = /^\s+$/.test(part);

              // Determine if this part should be animated
              // Only animate new content beyond the previous length
              const shouldAnimate =
                totalProcessedCharacters >= previousContentLength && !isWhitespace;

              // Calculate sequential delay based on global span index
              const delay = shouldAnimate ? Math.min(globalSpanIndex * staggerDelay, maxDelay) : 0;

              newChildren.push({
                type: 'element',
                tagName: 'span',
                properties: {
                  className: shouldAnimate ? animationClass : undefined,
                  style: shouldAnimate ? `animation-delay: ${delay}ms;` : undefined,
                  'data-animated-index': shouldAnimate ? String(globalSpanIndex) : undefined,
                  'data-char-position': String(totalProcessedCharacters),
                },
                children: [{ type: 'text', value: part }],
              });

              // Increment global index for non-whitespace elements
              if (!isWhitespace && shouldAnimate) {
                globalSpanIndex += 1;
              }

              // Always update character count
              totalProcessedCharacters += part.length;
            });
          } else {
            newChildren.push(child);
          }
        });

        node.children = newChildren;
      }
    });
  };
}
