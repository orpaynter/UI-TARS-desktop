# Workspace Renderers

This directory contains specialized renderers for different types of tool results in the UI-TARS Web UI workspace.

## Overview

The renderer system provides a flexible way to display tool results with appropriate formatting and interactivity. Each renderer is designed for specific tool types or data formats.

## Available Renderers

### Core Renderers
- **GenericResultRenderer**: Default fallback renderer for unknown content types
- **ImageRenderer**: Displays image content with zoom and download capabilities
- **LinkRenderer**: Renders clickable links with external indicators
- **SearchResultRenderer**: General search results display
- **BrowserResultRenderer**: Browser automation results
- **CommandResultRenderer**: Command execution results
- **ScriptResultRenderer**: Script execution outputs

### Omni TARS Specialized Renderers

#### OmniTarsSearchRenderer
Specialized renderer for Omni TARS Search tool results via MCP Google Search.

**Features:**
- Enhanced multilingual support with adaptive typography
- Optimized for MCP Google Search data format
- Search metadata display (result count, search time)
- Improved visual hierarchy and animations
- Responsive design with hover effects

**Data Format:**
```typescript
{
  type: 'omni_search',
  name: 'Search',
  data: {
    query: string,
    results: [{
      title: string,
      url: string,
      snippet: string
    }],
    total_results?: number,
    search_time?: number
  }
}
```

#### OmniTarsLinkReaderRenderer
Specialized renderer for Omni TARS LinkReader tool results via MCP Tavily Extract.

**Features:**
- Enhanced Markdown rendering with source/rendered toggle
- Image gallery for extracted images
- Rich metadata display (URL, title, extraction time)
- Adaptive typography for multilingual content
- Favicon display when available

**Data Format:**
```typescript
{
  type: 'omni_link_reader',
  name: 'LinkReader',
  data: {
    content: string,  // Markdown format
    url: string,
    title?: string,
    images?: string[],
    extract_time?: number,
    favicon?: string
  }
}
```

## Renderer Selection Logic

The `ToolResultRenderer` uses a priority-based selection system:

1. **Tool Name Matching** (Highest Priority)
   - `part.name === 'Search'` → `OmniTarsSearchRenderer`
   - `part.name === 'LinkReader'` → `OmniTarsLinkReaderRenderer`

2. **Content Type Matching**
   - `part.type` lookup in `CONTENT_RENDERERS`

3. **Fallback**
   - `GenericResultRenderer` for unknown types

## Design Principles

### Visual Design
- **Consistent**: Maintains design consistency with existing Web UI
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper contrast ratios and keyboard navigation
- **Animated**: Subtle animations for better user experience

### Typography
- **Multilingual Support**: Adaptive font settings for Chinese/English content
- **Hierarchy**: Clear visual hierarchy with proper font weights and sizes
- **Readability**: Optimized line heights and spacing

### Performance
- **Lazy Loading**: Images load only when needed
- **Error Handling**: Graceful degradation for missing or malformed data
- **Efficient Rendering**: Minimal re-renders with proper React optimization

## Adding New Renderers

1. **Create Renderer Component**
   ```typescript
   export const MyCustomRenderer: React.FC<{
     part: ToolResultContentPart;
     onAction?: (action: string, data: any) => void;
     displayMode?: FileDisplayMode;
   }> = ({ part, onAction, displayMode }) => {
     // Implementation
   };
   ```

2. **Register in ToolResultRenderer**
   ```typescript
   // Add to CONTENT_RENDERERS
   const CONTENT_RENDERERS = {
     // ...
     my_custom_type: MyCustomRenderer,
   };
   
   // Or add to getRenderer() for tool name matching
   function getRenderer(part: ToolResultContentPart) {
     if (part.name === 'MyTool') {
       return MyCustomRenderer;
     }
     // ...
   }
   ```

3. **Add Tests**
   Create tests in `__tests__/` directory following existing patterns.

## Testing

Run tests for the renderers:
```bash
npm test -- --testPathPattern=renderers
```

The test suite covers:
- Correct rendering of different data formats
- Error handling for malformed data
- Accessibility compliance
- Responsive behavior

## Future Enhancements

- [ ] Add keyboard navigation support
- [ ] Implement virtual scrolling for large result sets
- [ ] Add export functionality for search results
- [ ] Enhance image gallery with lightbox view
- [ ] Add caching for frequently accessed content
- [ ] Implement theme customization options
