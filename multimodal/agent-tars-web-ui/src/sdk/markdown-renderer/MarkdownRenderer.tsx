import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkAlert } from 'remark-github-blockquote-alert';
import rehypeHighlight from 'rehype-highlight';
import { Dialog } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CodeBlock } from './CodeBlock';
import { rehypeSplitWordsIntoSpans } from './plugins/rehype-animate-text';
import 'remark-github-blockquote-alert/alert.css';
import './syntax-highlight.css';
import './animate-text.css';

interface MarkdownRendererProps {
  content: string;
  publishDate?: string;
  author?: string;
  className?: string;
  forceDarkTheme?: boolean;
}

/**
 * MarkdownRenderer component with optimized streaming animation
 * Reduces flickering and eye strain through improved animation logic
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  forceDarkTheme = false,
}) => {
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const firstH1Ref = useRef(false);
  const markdownRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Improved animation detection with debouncing
  useEffect(() => {
    const currentLength = content.trim().length;
    const previousLength = prevContentRef.current.trim().length;
    const isIncremental = currentLength > previousLength && previousLength > 0;
    const hasContentChanged = prevContentRef.current.trim() !== content.trim();

    // Skip animation on initial mount with existing content
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (content.trim()) {
        prevContentRef.current = content;
        setShouldAnimate(false);
        return;
      }
    }

    // Clear existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Enable animation for incremental changes with debouncing
    if (hasContentChanged && isIncremental) {
      setShouldAnimate(true);

      // Auto-disable animation after a reasonable duration
      animationTimeoutRef.current = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000); // Increased timeout for smoother experience

      prevContentRef.current = content;
    } else {
      // No animation needed
      prevContentRef.current = content;
      setShouldAnimate(false);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [content]);

  // Optimized animation delay application
  useEffect(() => {
    if (shouldAnimate && markdownRef.current) {
      const container = markdownRef.current;
      const animatedSpans = container.querySelectorAll('.animate-fade-in');
      const spanCount = animatedSpans.length;

      if (spanCount === 0) return;

      // Improved delay calculation to prevent overwhelming animations
      const baseDelay = 30; // Minimum delay between animations
      const maxTotalDelay = 800; // Maximum total animation duration
      const delayPerSpan = Math.min(baseDelay, maxTotalDelay / spanCount);

      animatedSpans.forEach((span, index) => {
        const element = span as HTMLElement;

        // Reset animation state
        element.classList.remove('no-animation');
        element.style.opacity = '0';

        // Apply staggered delay with better distribution
        const delay = Math.min(index * delayPerSpan, maxTotalDelay);
        element.style.animationDelay = `${delay}ms`;

        // Force reflow to ensure animation starts properly
        element.offsetHeight;
      });
    }
  }, [shouldAnimate, content]);

  const handleImageClick = (src: string) => {
    setOpenImage(src);
    setImageLoaded(false);
  };

  const handleCloseModal = () => {
    setOpenImage(null);
  };

  // Handle hash navigation
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [content]);

  // Reset state when content changes
  useEffect(() => {
    firstH1Ref.current = false;
    setRenderError(null);
  }, [content]);

  if (renderError) {
    return (
      <div className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-800 dark:text-amber-200">
        <p className="font-medium mb-1">Markdown rendering error:</p>
        <pre className="text-xs overflow-auto">{content}</pre>
      </div>
    );
  }

  const themeClass = forceDarkTheme ? 'dark' : '';

  const createHeadingId = (children: React.ReactNode): string =>
    children
      ?.toString()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-') || '';

  const components: Components = useMemo(
    () => ({
      h1: ({ node, children, ...props }) => {
        const id = createHeadingId(children);
        const isFirstH1 = !firstH1Ref.current;
        if (isFirstH1) {
          firstH1Ref.current = true;
        }

        return (
          <h1
            id={id}
            className="group text-3xl font-bold mt-6 mb-2 pb-2 border-b border-gray-200 bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent scroll-mt-20 flex items-center"
            {...props}
          >
            {children}
          </h1>
        );
      },
      h2: ({ node, children, ...props }) => (
        <h2
          id={createHeadingId(children)}
          className="group text-2xl font-bold mt-6 mb-2 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent scroll-mt-20 flex items-center"
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ node, children, ...props }) => (
        <h3
          id={createHeadingId(children)}
          className="group text-xl font-semibold mt-8 mb-3 text-gray-800 scroll-mt-20 flex items-center"
          {...props}
        >
          {children}
        </h3>
      ),
      h4: ({ node, children, ...props }) => (
        <h4
          id={createHeadingId(children)}
          className="group text-md font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200 scroll-mt-20 flex items-center"
          {...props}
        >
          {children}
        </h4>
      ),
      p: ({ node, ...props }) => (
        <p className="my-0 text-gray-800 dark:text-gray-200 leading-relaxed" {...props} />
      ),
      a: ({ node, href, ...props }) => {
        if (href && href.startsWith('#')) {
          return (
            <a
              href={href}
              className="text-accent-500 hover:text-accent-600 transition-colors underline underline-offset-2"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(href.substring(1));
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState(null, '', href);
                }
              }}
              {...props}
            />
          );
        } else if (href && !href.match(/^(https?:)?\/\//) && href.startsWith('/')) {
          return (
            <Link
              to={href}
              className="text-accent-500 hover:text-accent-600 transition-colors underline underline-offset-2"
              {...props}
            />
          );
        }

        return (
          <a
            href={href}
            className="text-accent-500 hover:text-accent-600 transition-colors underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        );
      },
      ul: ({ node, ...props }) => <ul className="my-2 list-disc pl-6 text-gray-800" {...props} />,
      ol: ({ node, ...props }) => (
        <ol className="my-2 list-decimal pl-6 text-gray-800" {...props} />
      ),
      li: ({ node, ...props }) => <li className="my-1" {...props} />,
      blockquote: ({ node, ...props }) => (
        <blockquote
          className="border-l-4 border-purple-300 pl-4 my-4 italic text-gray-600"
          {...props}
        />
      ),
      code: ({ node, className, children, ...props }) => (
        <CodeBlock className={`${className} animate-code`} {...props}>
          {children}
        </CodeBlock>
      ),
      table: ({ node, ...props }) => (
        <div className="overflow-x-auto my-6">
          <table
            className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm"
            {...props}
          />
        </div>
      ),
      thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
      tbody: ({ node, ...props }) => (
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />
      ),
      tr: ({ node, ...props }) => (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />
      ),
      th: ({ node, ...props }) => (
        <th
          className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600"
          {...props}
        />
      ),
      td: ({ node, ...props }) => (
        <td
          className="px-4 py-3 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"
          {...props}
        />
      ),
      img: ({ node, src, ...props }) => (
        <motion.img
          className="max-w-full h-auto my-6 rounded-lg cursor-pointer"
          src={src}
          onClick={() => src && handleImageClick(src)}
          {...props}
          alt={props.alt || 'Documentation image'}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        />
      ),
      hr: ({ node, ...props }) => <hr className="my-8 border-t border-gray-200" {...props} />,
    }),
    [],
  );

  // Determine rehype plugins based on animation state
  const rehypePlugins = useMemo(() => {
    const basePlugins = [rehypeRaw, [rehypeHighlight, { detect: true, ignoreMissing: true }]];

    if (shouldAnimate) {
      return [...basePlugins, rehypeSplitWordsIntoSpans];
    }

    return basePlugins;
  }, [shouldAnimate]);

  try {
    return (
      <div
        ref={markdownRef}
        className={`${themeClass} markdown-content ${!shouldAnimate ? 'no-animation' : ''}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkAlert]}
          rehypePlugins={rehypePlugins}
          className={className}
          components={components}
        >
          {content}
        </ReactMarkdown>

        {/* Image preview dialog */}
        <Dialog open={!!openImage} onClose={handleCloseModal} className="relative z-[9999]">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-[90vw] max-h-[90vh] outline-none">
              <motion.img
                src={openImage || ''}
                alt="Enlarged view"
                onLoad={() => setImageLoaded(true)}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: imageLoaded ? 1 : 0.3,
                  scale: imageLoaded ? 1 : 0.95,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.3 }}
                onClick={handleCloseModal}
              />
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    );
  } catch (error) {
    console.error('Error rendering markdown:', error);
    setRenderError(error instanceof Error ? error : new Error(String(error)));
    return (
      <pre className="p-3 text-sm border border-gray-200 rounded-md overflow-auto">{content}</pre>
    );
  }
};
