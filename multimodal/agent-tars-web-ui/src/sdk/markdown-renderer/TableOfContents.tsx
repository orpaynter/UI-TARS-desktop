import React, { useState, useEffect, useRef } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  markdown: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ markdown }) => {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tocRef = useRef<HTMLDivElement>(null);

  // Extract headings from markdown
  useEffect(() => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...markdown.matchAll(headingRegex)];

    const tocItems: TOCItem[] = matches
      .map((match) => {
        const level = match[1].length;
        const text = match[2];
        const id = text
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');

        return { id, text, level };
      })
      // Filter out h1 headings except the first one
      .filter((item, index) => !(index === 0 && item.level === 1));

    setItems(tocItems);
  }, [markdown]);

  // Set up intersection observer to track visible headings
  useEffect(() => {
    if (items.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create a new intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-60px 0px -80% 0px',
        threshold: 0.1,
      },
    );

    // Observe all section headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [items]);

  // Handle initial active heading when page loads with a hash
  useEffect(() => {
    if (window.location.hash && items.length > 0) {
      setActiveId(window.location.hash.substring(1));
    }
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div ref={tocRef} className="sticky top-0 max-h-[calc(100vh-8rem)] overflow-y-auto z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h4 className="text-sm font-medium text-accent-700 mb-3">Table of Contents</h4>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
              <a
                href={`#${item.id}`}
                className={`text-sm block py-1 transition-colors ${
                  activeId === item.id
                    ? 'text-accent-700 font-medium'
                    : 'text-gray-600 hover:text-accent-800'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(item.id);
                  if (element) {
                    window.history.pushState(null, '', `#${item.id}`);
                    element.scrollIntoView({ behavior: 'smooth' });
                    setActiveId(item.id);
                  }
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TableOfContents;
