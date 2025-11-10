# @orpaynter/connector-huggingface

Hugging Face connector for OrPaynter - Access 100,000+ AI models for text, vision, and multimodal tasks.

## Features

- ✅ Text generation with state-of-the-art LLMs
- ✅ Text embeddings for semantic search
- ✅ Image classification and object detection
- ✅ Question answering
- ✅ Sentiment analysis
- ✅ Text summarization
- ✅ Translation (100+ language pairs)
- ✅ Full TypeScript support
- ✅ Error handling and retry logic

## Installation

```bash
npm install @orpaynter/connector-huggingface
# or
pnpm add @orpaynter/connector-huggingface
```

## Quick Start

```typescript
import { createHuggingFaceConnector } from '@orpaynter/connector-huggingface';

const hf = createHuggingFaceConnector({
  apiKey: process.env.HUGGINGFACE_API_KEY!
});

// Generate text
const text = await hf.generateText('Write a roofing estimate for');

// Create embeddings for semantic search
const embedding = await hf.createEmbedding('roof damage assessment');

// Classify roof images
const labels = await hf.classifyImage('https://example.com/roof.jpg');

// Detect damage on roof
const objects = await hf.detectObjects('https://example.com/roof.jpg');
```

## API Reference

### Configuration

```typescript
interface HuggingFaceConfig {
  apiKey: string;           // Your Hugging Face API key
  baseUrl?: string;         // Optional custom base URL
}
```

### Text Generation

Generate text using language models:

```typescript
const text = await hf.generateText('Complete this sentence:', {
  model: 'gpt2',              // Model name (default: 'gpt2')
  temperature: 0.7,           // Randomness (0.0 - 1.0)
  maxTokens: 256,             // Maximum tokens to generate
  topP: 0.9,                  // Nucleus sampling
  stopSequences: ['\n\n']     // Stop generation at these sequences
});
```

**Popular Models:**
- `gpt2` - General purpose text generation
- `EleutherAI/gpt-neo-2.7B` - Larger, more capable model
- `facebook/opt-1.3b` - Meta's OPT model

### Embeddings

Create vector embeddings for semantic search:

```typescript
// Single text embedding
const embedding = await hf.createEmbedding('roof damage assessment');

// Batch embeddings
const embeddings = await hf.createEmbeddings([
  'hail damage on shingles',
  'wind damage inspection',
  'roof leak repair'
], {
  model: 'sentence-transformers/all-MiniLM-L6-v2'
});
```

**Popular Models:**
- `sentence-transformers/all-MiniLM-L6-v2` - Fast, 384 dimensions
- `sentence-transformers/all-mpnet-base-v2` - High quality, 768 dimensions
- `BAAI/bge-large-en-v1.5` - State-of-the-art, 1024 dimensions

### Image Classification

Classify images into categories:

```typescript
const labels = await hf.classifyImage('https://example.com/roof.jpg', {
  model: 'google/vit-base-patch16-224',  // Vision Transformer model
  topK: 5                                 // Return top 5 predictions
});

// Result:
// [
//   { label: 'asphalt shingle', score: 0.92 },
//   { label: 'roofing material', score: 0.85 },
//   ...
// ]
```

### Object Detection

Detect objects and damage in images:

```typescript
const objects = await hf.detectObjects('https://example.com/roof.jpg', {
  model: 'facebook/detr-resnet-50',
  threshold: 0.5    // Minimum confidence threshold
});

// Result:
// [
//   {
//     label: 'damage',
//     score: 0.87,
//     box: { xmin: 100, ymin: 50, xmax: 300, ymax: 200 }
//   },
//   ...
// ]
```

### Question Answering

Extract answers from context:

```typescript
const result = await hf.answerQuestion(
  'What type of damage was found?',
  'The roof inspection revealed hail damage on the north side with missing shingles.',
  { model: 'deepset/roberta-base-squad2' }
);

// Result: { answer: 'hail damage', score: 0.95 }
```

### Sentiment Analysis

Analyze sentiment of text:

```typescript
const sentiment = await hf.analyzeSentiment(
  'The roofing work was excellent and completed on time!'
);

// Result:
// [
//   { label: 'POSITIVE', score: 0.98 },
//   { label: 'NEGATIVE', score: 0.02 }
// ]
```

### Text Summarization

Summarize long documents:

```typescript
const summary = await hf.summarizeText(longReport, {
  model: 'facebook/bart-large-cnn',
  maxLength: 130,
  minLength: 30
});
```

### Translation

Translate between 100+ languages:

```typescript
const translated = await hf.translate(
  '屋根の修理が必要です',  // "Roof repair needed"
  'ja',                    // Japanese
  'en'                     // to English
);

// Result: "Roof repair is needed"
```

## Use Cases for Roofing

### 1. Damage Assessment

```typescript
// Classify damage type from photos
const damageType = await hf.classifyImage(roofPhoto, {
  model: 'microsoft/resnet-50',
  topK: 3
});

// Detect specific damage locations
const damages = await hf.detectObjects(roofPhoto, {
  threshold: 0.6
});

// Generate damage report
const report = await hf.generateText(
  `Based on the detected ${damageType[0].label}, write a brief damage assessment:`,
  { maxTokens: 200 }
);
```

### 2. Semantic Search

```typescript
// Create embeddings for all inspection reports
const reports = [
  'Hail damage on asphalt shingles, north side',
  'Wind damage with missing shingles, west side',
  'Leak in flashing around chimney'
];

const reportEmbeddings = await hf.createEmbeddings(reports);

// Search for similar reports
const queryEmbedding = await hf.createEmbedding('shingle damage from storm');

// Use with Qdrant connector for similarity search
// (See semantic search example below)
```

### 3. Automated Responses

```typescript
// Answer customer questions
const answer = await hf.answerQuestion(
  'How long will the roof repair take?',
  customerInquiryContext
);

// Analyze customer sentiment
const sentiment = await hf.analyzeSentiment(customerFeedback);
```

## Integration with Qdrant (Semantic Search)

Combine Hugging Face embeddings with Qdrant for powerful semantic search:

```typescript
import { createHuggingFaceConnector } from '@orpaynter/connector-huggingface';
import { createQdrantConnector } from '@orpaynter/connector-qdrant';

const hf = createHuggingFaceConnector({ apiKey: HF_API_KEY });
const qdrant = createQdrantConnector({ url: QDRANT_URL, apiKey: QDRANT_KEY });

// Create collection
await qdrant.createCollection('roof_inspections', 384, 'Cosine');

// Index inspection reports
const reports = [
  { id: 1, text: 'Hail damage on asphalt shingles' },
  { id: 2, text: 'Wind damage with missing tiles' },
  { id: 3, text: 'Water leak from flashing' }
];

for (const report of reports) {
  const embedding = await hf.createEmbedding(report.text);
  await qdrant.upsert('roof_inspections', [{
    id: report.id,
    vector: embedding,
    payload: { text: report.text }
  }]);
}

// Search for similar reports
const query = 'storm damage on roof';
const queryEmbedding = await hf.createEmbedding(query);
const results = await qdrant.search('roof_inspections', {
  vector: queryEmbedding,
  limit: 5
});
```

## Error Handling

```typescript
try {
  const text = await hf.generateText('Generate estimate');
} catch (error) {
  if (error instanceof Error) {
    console.error('Hugging Face error:', error.message);
  }
}
```

## Best Practices

1. **Use appropriate models for your use case**
   - Small models (GPT-2) for simple tasks
   - Large models (GPT-Neo) for complex generation

2. **Batch embeddings when possible**
   ```typescript
   // Good - single API call
   const embeddings = await hf.createEmbeddings(texts);
   
   // Bad - multiple API calls
   const embeddings = await Promise.all(
     texts.map(t => hf.createEmbedding(t))
   );
   ```

3. **Set appropriate confidence thresholds**
   ```typescript
   const objects = await hf.detectObjects(image, {
     threshold: 0.7  // Higher threshold = more confident predictions
   });
   ```

4. **Cache embeddings to reduce API calls**

5. **Handle rate limits gracefully**

## Models Overview

| Task | Recommended Model | Dimensions/Output |
|------|------------------|-------------------|
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | 384 |
| Text Generation | `gpt2` or `EleutherAI/gpt-neo-2.7B` | Text |
| Image Classification | `google/vit-base-patch16-224` | Labels |
| Object Detection | `facebook/detr-resnet-50` | Bounding boxes |
| Question Answering | `deepset/roberta-base-squad2` | Answer + score |
| Sentiment | `distilbert-base-uncased-finetuned-sst-2-english` | Labels |
| Summarization | `facebook/bart-large-cnn` | Summary |

## Environment Variables

```bash
# Required
HUGGINGFACE_API_KEY=hf_...

# Optional
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co
```

## Resources

- [Hugging Face Models](https://huggingface.co/models)
- [Inference API Docs](https://huggingface.co/docs/api-inference)
- [Model Hub](https://huggingface.co/models)

## License

MIT
