import React from 'react';
import { render, screen } from '@testing-library/react';
import { OmniTarsSearchRenderer } from '../OmniTarsSearchRenderer';
import { OmniTarsLinkReaderRenderer } from '../OmniTarsLinkReaderRenderer';
import { ToolResultContentPart } from '../../types';

// Mock framer-motion to avoid issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('OmniTarsSearchRenderer', () => {
  const mockSearchData: ToolResultContentPart = {
    type: 'omni_search',
    name: 'Search',
    data: {
      query: 'test search query',
      results: [
        {
          title: 'Test Result 1',
          url: 'https://example.com/1',
          snippet: 'This is a test snippet for the first result',
        },
        {
          title: 'Test Result 2',
          url: 'https://example.com/2',
          snippet: 'This is a test snippet for the second result',
        },
      ],
      total_results: 1000,
      search_time: 0.5,
    },
  };

  it('renders search results correctly', () => {
    render(<OmniTarsSearchRenderer part={mockSearchData} />);
    
    expect(screen.getByText('test search query')).toBeInTheDocument();
    expect(screen.getByText('Test Result 1')).toBeInTheDocument();
    expect(screen.getByText('Test Result 2')).toBeInTheDocument();
    expect(screen.getByText('1,000 results')).toBeInTheDocument();
    expect(screen.getByText('0.5s')).toBeInTheDocument();
  });

  it('handles empty results', () => {
    const emptyData: ToolResultContentPart = {
      type: 'omni_search',
      name: 'Search',
      data: {
        query: 'empty search',
        results: [],
      },
    };

    render(<OmniTarsSearchRenderer part={emptyData} />);
    
    expect(screen.getByText('empty search')).toBeInTheDocument();
    expect(screen.getByText('No Results Found')).toBeInTheDocument();
  });

  it('handles malformed data gracefully', () => {
    const malformedData: ToolResultContentPart = {
      type: 'omni_search',
      name: 'Search',
      data: 'invalid json string',
    };

    render(<OmniTarsSearchRenderer part={malformedData} />);
    
    expect(screen.getByText('No search results available')).toBeInTheDocument();
  });
});

describe('OmniTarsLinkReaderRenderer', () => {
  const mockLinkReaderData: ToolResultContentPart = {
    type: 'omni_link_reader',
    name: 'LinkReader',
    data: {
      url: 'https://example.com/article',
      title: 'Test Article Title',
      content: '# Test Article\n\nThis is a test article with **markdown** content.',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      extract_time: 1.2,
    },
  };

  it('renders link reader content correctly', () => {
    render(<OmniTarsLinkReaderRenderer part={mockLinkReaderData} />);
    
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Extracted in 1.2s')).toBeInTheDocument();
    expect(screen.getByText('Extracted Images (2)')).toBeInTheDocument();
  });

  it('handles content without images', () => {
    const noImagesData: ToolResultContentPart = {
      type: 'omni_link_reader',
      name: 'LinkReader',
      data: {
        url: 'https://example.com/simple',
        content: 'Simple text content without images.',
      },
    };

    render(<OmniTarsLinkReaderRenderer part={noImagesData} />);
    
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.queryByText(/Extracted Images/)).not.toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const emptyData: ToolResultContentPart = {
      type: 'omni_link_reader',
      name: 'LinkReader',
      data: {},
    };

    render(<OmniTarsLinkReaderRenderer part={emptyData} />);
    
    expect(screen.getByText('No content available')).toBeInTheDocument();
  });
});
