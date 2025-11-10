# @orpaynter/toolkit-semantic-search

Semantic search toolkit for OrPaynter - AI-powered search for roofing documents, inspections, and reports using vector embeddings.

## Features

- ✅ Semantic search (find by meaning, not just keywords)
- ✅ Document indexing with automatic embedding generation
- ✅ Batch operations for efficiency
- ✅ Hybrid search (semantic + keyword filtering)
- ✅ Similar document discovery
- ✅ Multi-query search
- ✅ Full TypeScript support
- ✅ Production-ready with Qdrant vector database

## Installation

```bash
npm install @orpaynter/toolkit-semantic-search \
            @orpaynter/connector-qdrant \
            @orpaynter/connector-huggingface
# or
pnpm add @orpaynter/toolkit-semantic-search \
         @orpaynter/connector-qdrant \
         @orpaynter/connector-huggingface
```

## Quick Start

```typescript
import { createSemanticSearch } from '@orpaynter/toolkit-semantic-search';

const search = createSemanticSearch({
  qdrant: {
    url: 'https://your-qdrant-instance.io',
    apiKey: process.env.QDRANT_API_KEY
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY
  },
  collectionName: 'roof_inspections'
});

// Initialize collection
await search.initializeCollection();

// Index documents
await search.indexDocuments([
  { id: 1, text: 'Hail damage on asphalt shingles, north side' },
  { id: 2, text: 'Wind damage with missing tiles, west side' },
  { id: 3, text: 'Water leak from flashing around chimney' }
]);

// Search by meaning
const results = await search.search('storm damage on roof', { limit: 5 });
```

## API Reference

### Configuration

```typescript
interface SemanticSearchConfig {
  qdrant: {
    url: string;              // Qdrant instance URL
    apiKey?: string;          // Optional API key
  };
  huggingface: {
    apiKey: string;           // Hugging Face API key
  };
  collectionName?: string;    // Collection name (default: 'orpaynter_documents')
  embeddingModel?: string;    // Embedding model (default: 'sentence-transformers/all-MiniLM-L6-v2')
  embeddingDimensions?: number; // Embedding dimensions (default: 384)
}
```

### Collection Management

Initialize the collection (creates if doesn't exist):

```typescript
await search.initializeCollection();
```

Get collection information:

```typescript
const info = await search.getCollectionInfo();
console.log(info.vectorsCount); // Number of indexed documents
```

Delete the collection:

```typescript
await search.deleteCollection();
```

### Document Operations

Index a single document:

```typescript
await search.indexDocument({
  id: 1,
  text: 'Roof inspection report for 123 Main St',
  metadata: {
    address: '123 Main St',
    date: '2024-01-15',
    inspector: 'John Doe'
  }
});
```

Index multiple documents (more efficient):

```typescript
await search.indexDocuments([
  {
    id: 1,
    text: 'Hail damage on asphalt shingles',
    metadata: { severity: 'high', date: '2024-01-15' }
  },
  {
    id: 2,
    text: 'Minor wear on ridge caps',
    metadata: { severity: 'low', date: '2024-01-16' }
  }
]);
```

Delete a document:

```typescript
await search.deleteDocument(1);
```

### Search

Basic semantic search:

```typescript
const results = await search.search('roof damage from storm', {
  limit: 10,                    // Number of results (default: 10)
  scoreThreshold: 0.7,          // Minimum similarity score (0.0 - 1.0)
  filter: {                     // Optional metadata filter
    key: 'severity',
    match: { value: 'high' }
  }
});

// Results:
// [
//   {
//     id: 1,
//     score: 0.92,
//     text: 'Hail damage on asphalt shingles',
//     metadata: { severity: 'high', date: '2024-01-15' }
//   },
//   ...
// ]
```

Find similar documents:

```typescript
// Find documents similar to document ID 1
const similar = await search.searchSimilarDocuments(1, {
  limit: 5
});
```

Hybrid search (semantic + keyword filtering):

```typescript
const results = await search.hybridSearch(
  'roof damage',                // Semantic query
  ['shingles', 'tiles'],        // Keywords to boost
  { limit: 10 }
);
```

Multi-query search:

```typescript
const results = await search.multiSearch([
  'hail damage',
  'wind damage',
  'water leak'
], { limit: 5 });

// Returns array of result arrays (one per query)
```

## Use Cases

### 1. Inspection Report Search

```typescript
import { createSemanticSearch } from '@orpaynter/toolkit-semantic-search';

const search = createSemanticSearch({
  qdrant: {
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY!
  },
  collectionName: 'inspection_reports'
});

// Initialize
await search.initializeCollection();

// Index all inspection reports
const reports = await database.getInspectionReports();
await search.indexDocuments(reports.map(report => ({
  id: report.id,
  text: report.summary,
  metadata: {
    address: report.address,
    date: report.date,
    inspector: report.inspector,
    severity: report.severity
  }
})));

// Search for similar issues
const results = await search.search('missing shingles after storm');

// Find all related inspections
const similar = await search.searchSimilarDocuments(reportId);
```

### 2. Knowledge Base Search

```typescript
// Index roofing knowledge articles
const articles = [
  {
    id: 1,
    text: 'How to identify hail damage: Look for dents in shingles, damaged flashing...',
    metadata: { category: 'damage-identification', topic: 'hail' }
  },
  {
    id: 2,
    text: 'Wind damage signs: Missing shingles, lifted edges, exposed underlayment...',
    metadata: { category: 'damage-identification', topic: 'wind' }
  }
];

await search.indexDocuments(articles);

// Search for answers
const answer = await search.search('how to spot wind damage on roof', {
  limit: 3,
  filter: { key: 'category', match: { value: 'damage-identification' } }
});
```

### 3. Customer Query Resolution

```typescript
// Index FAQ and support articles
await search.indexDocuments(faqs);

// Find relevant answers to customer questions
const customerQuery = 'How long does roof repair take?';
const answers = await search.search(customerQuery, { limit: 3 });

// Use top result to generate response
const topAnswer = answers[0];
console.log(`Best match (${topAnswer.score.toFixed(2)}): ${topAnswer.text}`);
```

### 4. Estimate Template Search

```typescript
// Index past estimates
const estimates = await database.getEstimates();
await search.indexDocuments(estimates.map(est => ({
  id: est.id,
  text: `${est.description} - ${est.materials} - ${est.notes}`,
  metadata: {
    roofType: est.roofType,
    squareFeet: est.squareFeet,
    material: est.material,
    price: est.price
  }
})));

// Find similar past estimates
const newProject = 'Replace asphalt shingles on 2000 sq ft ranch home';
const similar = await search.search(newProject, {
  limit: 5,
  filter: {
    must: [
      { key: 'roofType', match: { value: 'ranch' } },
      { key: 'squareFeet', range: { gte: 1800, lte: 2200 } }
    ]
  }
});

// Use similar estimates as templates
const averagePrice = similar.reduce((sum, r) => sum + r.metadata.price, 0) / similar.length;
```

## Complete Example

```typescript
import { createSemanticSearch } from '@orpaynter/toolkit-semantic-search';

async function setupRoofingKnowledgeBase() {
  const search = createSemanticSearch({
    qdrant: {
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY!
    },
    collectionName: 'roofing_knowledge'
  });
  
  // Initialize
  await search.initializeCollection();
  
  // Index knowledge articles
  const articles = [
    {
      id: 1,
      text: 'Hail damage appears as round dents or bruises on shingles. Check for granule loss and cracked shingles.',
      metadata: { category: 'damage', type: 'hail', severity: 'high' }
    },
    {
      id: 2,
      text: 'Wind damage shows as lifted, creased, or missing shingles. Look for exposed underlayment.',
      metadata: { category: 'damage', type: 'wind', severity: 'medium' }
    },
    {
      id: 3,
      text: 'Roof leaks often originate from damaged flashing, especially around chimneys and vents.',
      metadata: { category: 'maintenance', type: 'leak', severity: 'high' }
    },
    {
      id: 4,
      text: 'Regular roof inspections should be done twice yearly, in spring and fall.',
      metadata: { category: 'maintenance', type: 'inspection', severity: 'low' }
    }
  ];
  
  await search.indexDocuments(articles);
  
  // Search functionality
  async function askQuestion(question: string) {
    console.log(`\nQ: ${question}`);
    
    const results = await search.search(question, {
      limit: 3,
      scoreThreshold: 0.6
    });
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. (score: ${result.score.toFixed(2)}) ${result.text}`);
      console.log(`   Metadata:`, result.metadata);
    });
  }
  
  // Example queries
  await askQuestion('What does hail damage look like?');
  await askQuestion('How to find a roof leak?');
  await askQuestion('When should I inspect my roof?');
  
  // Find similar articles
  const similar = await search.searchSimilarDocuments(1, { limit: 2 });
  console.log('\nArticles similar to article 1:');
  similar.forEach(result => {
    console.log(`- (score: ${result.score.toFixed(2)}) ${result.text}`);
  });
}

setupRoofingKnowledgeBase();
```

## Advanced Features

### Custom Embedding Models

Use different embedding models for better accuracy:

```typescript
const search = createSemanticSearch({
  qdrant: { url: QDRANT_URL, apiKey: QDRANT_KEY },
  huggingface: { apiKey: HF_KEY },
  embeddingModel: 'sentence-transformers/all-mpnet-base-v2',  // Higher quality
  embeddingDimensions: 768
});
```

**Popular Models:**
- `sentence-transformers/all-MiniLM-L6-v2` - Fast, 384 dimensions (default)
- `sentence-transformers/all-mpnet-base-v2` - High quality, 768 dimensions
- `BAAI/bge-large-en-v1.5` - State-of-the-art, 1024 dimensions

### Filtering and Metadata

Use metadata filters for precise searches:

```typescript
const results = await search.search('roof damage', {
  filter: {
    must: [
      { key: 'severity', match: { value: 'high' } },
      { key: 'date', range: { gte: '2024-01-01' } }
    ]
  }
});
```

### Batch Processing

Process large document sets efficiently:

```typescript
// Index in batches of 100
const batchSize = 100;
for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize);
  await search.indexDocuments(batch);
  console.log(`Indexed ${i + batch.length}/${documents.length} documents`);
}
```

## Best Practices

1. **Use batch operations**
   ```typescript
   // Good - single API call
   await search.indexDocuments(docs);
   
   // Bad - multiple API calls
   for (const doc of docs) {
     await search.indexDocument(doc);
   }
   ```

2. **Include rich metadata**
   ```typescript
   await search.indexDocument({
     id: 1,
     text: 'Full inspection report text...',
     metadata: {
       address: '123 Main St',
       date: '2024-01-15',
       severity: 'high',
       inspector: 'John Doe',
       tags: ['hail', 'shingles', 'urgent']
     }
   });
   ```

3. **Set appropriate score thresholds**
   ```typescript
   // Only return highly relevant results
   const results = await search.search(query, {
     scoreThreshold: 0.7
   });
   ```

4. **Use similar document search for recommendations**

5. **Combine with metadata filtering for precision**

## Performance

- **Indexing**: ~100 documents/second (batch)
- **Search**: ~50ms average query time
- **Storage**: ~1.5KB per document (384-dim embeddings)

## Troubleshooting

**Connection errors:**
```typescript
// Ensure Qdrant is running and accessible
const info = await search.getCollectionInfo();
```

**Embedding errors:**
```typescript
// Check Hugging Face API key
const hf = createHuggingFaceConnector({ apiKey: HF_KEY });
const test = await hf.createEmbedding('test');
```

**No results:**
```typescript
// Lower score threshold
const results = await search.search(query, {
  scoreThreshold: 0.5  // Lower = more permissive
});
```

## Environment Variables

```bash
# Qdrant
QDRANT_URL=https://your-instance.qdrant.io
QDRANT_API_KEY=your_qdrant_key

# Hugging Face
HUGGINGFACE_API_KEY=hf_your_key
```

## License

MIT
