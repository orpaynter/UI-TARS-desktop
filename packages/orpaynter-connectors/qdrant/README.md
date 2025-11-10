# Qdrant Vector Database Connector

Official OrPaynter connector for Qdrant vector database - enabling semantic search and vector operations.

## Installation

```bash
npm install @orpaynter/connector-qdrant
# or
pnpm add @orpaynter/connector-qdrant
```

## Setup

### 1. Get Qdrant Instance

**Option A: Qdrant Cloud (Recommended)**
1. Sign up at [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a cluster
3. Get your cluster URL and API key

**Option B: Self-hosted**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 2. Initialize the connector

```typescript
import { createQdrantConnector } from '@orpaynter/connector-qdrant';

const qdrant = createQdrantConnector({
  url: 'https://your-cluster.qdrant.io',
  apiKey: 'your_api_key' // optional for self-hosted
});
```

## Usage

### Collection Management

```typescript
// Create a collection for 1536-dimensional vectors (OpenAI embeddings)
await qdrant.createCollection('documents', 1536, 'Cosine');

// List all collections
const collections = await qdrant.listCollections();
console.log(collections); // ['documents', 'images', ...]

// Get collection info
const info = await qdrant.getCollection('documents');
console.log(info);
// {
//   name: 'documents',
//   vectors_count: 10000,
//   points_count: 10000,
//   segments_count: 1,
//   status: 'green'
// }

// Delete a collection
await qdrant.deleteCollection('old_collection');
```

### Upserting Vectors

```typescript
// Single vector
await qdrant.upsert('documents', [
  {
    id: 1,
    vector: [0.1, 0.2, 0.3, ...], // 1536 dimensions
    payload: {
      text: 'Example document about roof repair',
      category: 'roofing',
      date: '2025-11-10',
      author: 'John Doe'
    }
  }
]);

// Batch upsert
const vectors = [];
for (let i = 0; i < 100; i++) {
  vectors.push({
    id: i,
    vector: generateEmbedding(documents[i]),
    payload: { text: documents[i], index: i }
  });
}
await qdrant.upsert('documents', vectors);
```

### Semantic Search

```typescript
// Search for similar vectors
const queryEmbedding = await generateEmbedding('roof damage assessment');

const results = await qdrant.search('documents', {
  vector: queryEmbedding,
  limit: 10,
  score_threshold: 0.7, // Only return results with similarity > 0.7
  with_payload: true,
  with_vector: false
});

results.forEach(result => {
  console.log(`Score: ${result.score}`);
  console.log(`Text: ${result.payload.text}`);
});
```

### Filtered Search

```typescript
// Search with metadata filter
const results = await qdrant.search('documents', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [
      { key: 'category', match: { value: 'roofing' } }
    ],
    should: [
      { key: 'author', match: { value: 'John Doe' } }
    ]
  }
});
```

### Recommendation

```typescript
// Find similar documents to positive examples, excluding negative examples
const similar = await qdrant.recommend(
  'documents',
  [1, 5, 10], // IDs of positive examples
  [2, 7],     // IDs of negative examples (optional)
  {
    limit: 5,
    score_threshold: 0.8
  }
);
```

### Retrieve by ID

```typescript
// Get a specific vector by ID
const point = await qdrant.getPoint('documents', 1);
if (point) {
  console.log(point.payload);
  console.log(point.vector);
}
```

### Delete Points

```typescript
// Delete specific points
await qdrant.deletePoints('documents', [1, 2, 3, 4, 5]);
```

### Scroll Through Collection

```typescript
// Iterate through all points
let offset = undefined;
const allPoints = [];

while (true) {
  const response = await qdrant.scroll('documents', {
    limit: 100,
    offset,
    with_payload: true,
    with_vector: false
  });
  
  allPoints.push(...response.points);
  
  if (!response.next_offset) break;
  offset = response.next_offset;
}

console.log(`Total points: ${allPoints.length}`);
```

### Count Points

```typescript
// Total points in collection
const total = await qdrant.count('documents');

// Count with filter
const roofingDocs = await qdrant.count('documents', {
  must: [
    { key: 'category', match: { value: 'roofing' } }
  ]
});
```

## Integration with OpenAI

```typescript
import { OpenAI } from 'openai';
import { createQdrantConnector } from '@orpaynter/connector-qdrant';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = createQdrantConnector({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY
});

// Generate embedding
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

// Index a document
async function indexDocument(id: number, text: string, metadata: any) {
  const vector = await generateEmbedding(text);
  await qdrant.upsert('documents', [{
    id,
    vector,
    payload: { text, ...metadata }
  }]);
}

// Search documents
async function searchDocuments(query: string, limit: number = 10) {
  const queryVector = await generateEmbedding(query);
  return await qdrant.search('documents', {
    vector: queryVector,
    limit,
    with_payload: true
  });
}

// Use it
await indexDocument(1, 'Roof repair guide for hail damage', {
  category: 'roofing',
  type: 'guide'
});

const results = await searchDocuments('how to fix hail damage on roof');
console.log(results);
```

## Distance Metrics

Qdrant supports three distance metrics:

- **Cosine** (default): Best for normalized vectors (e.g., OpenAI embeddings)
- **Euclid**: Best for spatial data
- **Dot**: Fast, but requires normalized vectors

```typescript
// Cosine similarity (recommended for text)
await qdrant.createCollection('docs', 1536, 'Cosine');

// Euclidean distance (for spatial data)
await qdrant.createCollection('locations', 2, 'Euclid');

// Dot product (fastest, requires normalized vectors)
await qdrant.createCollection('normalized', 768, 'Dot');
```

## Error Handling

```typescript
try {
  await qdrant.createCollection('existing', 1536);
} catch (error) {
  console.error('Failed to create collection:', error);
  // Collection might already exist
}

// Check health before operations
const isHealthy = await qdrant.health();
if (!isHealthy) {
  console.error('Qdrant is not available');
}
```

## Pricing Tiers

### Free Tier (Qdrant Cloud)
- 1GB RAM
- 5GB storage
- 100,000 vectors
- Perfect for development

### Pro Tier ($30/month)
- 8GB RAM
- 50GB storage
- 1M+ vectors
- Auto-scaling

### Enterprise Tier
- Custom configuration
- Dedicated clusters
- SLA guarantees
- Contact sales@orpaynter.com

## Best Practices

1. **Batch Operations:** Upsert in batches of 100-1000 for better performance
2. **Indexing:** Qdrant automatically handles indexing - no manual optimization needed
3. **Filters:** Use filters to narrow search space before vector comparison
4. **Distance Metric:** Use Cosine for text embeddings, Euclid for spatial data
5. **Payloads:** Keep payloads small; store full content in primary database
6. **Monitoring:** Monitor collection size and query performance

## Performance Tips

```typescript
// ✅ Good: Batch upsert
await qdrant.upsert('docs', vectorArray);

// ❌ Bad: Individual upserts in loop
for (const vec of vectorArray) {
  await qdrant.upsert('docs', [vec]); // Slow!
}

// ✅ Good: Filter before search
await qdrant.search('docs', {
  vector: queryVector,
  limit: 10,
  filter: { must: [{ key: 'category', match: { value: 'roofing' } }] }
});

// ✅ Good: Use scroll for large datasets
const { points, next_offset } = await qdrant.scroll('docs', { limit: 100 });
```

## TypeScript Support

Full TypeScript support with comprehensive types:

```typescript
import type {
  QdrantConfig,
  Vector,
  SearchParams,
  SearchResult,
  CollectionInfo
} from '@orpaynter/connector-qdrant';
```

## Examples

See the `/examples` directory for complete working examples:

- Basic CRUD operations
- Semantic search implementation
- Recommendation system
- Hybrid search (vector + filters)
- OpenAI integration
- Multi-language search

## Support

- Documentation: https://orpaynter.com/docs/connectors/qdrant
- Qdrant Docs: https://qdrant.tech/documentation
- Issues: https://github.com/orpaynter/UI-TARS-desktop/issues
- Email: support@orpaynter.com

## License

MIT
