# @orpaynter/connector-minimax

MiniMax AI connector for OrPaynter - Advanced Chinese and multilingual LLM, embeddings, and multimodal AI services.

## Features

- ✅ Chat completion with Chinese LLMs (abab5.5, abab6)
- ✅ Streaming chat responses
- ✅ Text embeddings for semantic search
- ✅ Text-to-speech (多种中文语音)
- ✅ Speech-to-text (语音识别)
- ✅ Image generation from text
- ✅ Full TypeScript support
- ✅ Error handling and retry logic

## Installation

```bash
npm install @orpaynter/connector-minimax
# or
pnpm add @orpaynter/connector-minimax
```

## Quick Start

```typescript
import { createMiniMaxConnector } from '@orpaynter/connector-minimax';

const minimax = createMiniMaxConnector({
  apiKey: process.env.MINIMAX_API_KEY!,
  groupId: process.env.MINIMAX_GROUP_ID!
});

// Chat with AI
const response = await minimax.chat([
  { role: 'user', content: '请帮我生成一份屋顶维修报价单' }
]);

// Create embeddings
const embedding = await minimax.createEmbedding('屋顶损坏评估');

// Text-to-speech
const audioBuffer = await minimax.textToSpeech('您好，这是您的屋顶检查报告');
```

## API Reference

### Configuration

```typescript
interface MiniMaxConfig {
  apiKey: string;      // Your MiniMax API key
  groupId: string;     // Your MiniMax Group ID
  baseUrl?: string;    // Optional custom base URL
}
```

### Chat Completion

Chat with advanced Chinese LLMs:

```typescript
const response = await minimax.chat([
  { role: 'system', content: '你是一个专业的屋顶检查专家' },
  { role: 'user', content: '屋顶有冰雹损坏，应该如何处理？' }
], {
  model: 'abab5.5-chat',    // Model: abab5.5-chat, abab6-chat
  temperature: 0.7,          // Randomness (0.0 - 1.0)
  topP: 0.95,                // Nucleus sampling
  maxTokens: 2048            // Maximum tokens
});
```

**Available Models:**
- `abab5.5-chat` - Fast, cost-effective
- `abab6-chat` - More capable, better reasoning

### Streaming Chat

Stream responses in real-time:

```typescript
const stream = minimax.chatStream([
  { role: 'user', content: '生成一份详细的屋顶检查报告' }
]);

for await (const chunk of stream) {
  process.stdout.write(chunk);  // Print incrementally
}
```

### Embeddings

Create vector embeddings for semantic search:

```typescript
// Single embedding
const embedding = await minimax.createEmbedding('屋顶损坏评估', {
  model: 'embo-01',
  type: 'query'       // 'query' for search queries, 'db' for documents
});

// Batch embeddings
const embeddings = await minimax.createEmbeddings([
  '冰雹损坏的瓦片',
  '风力损坏检查',
  '屋顶漏水修复'
], {
  type: 'db'
});
```

**Embedding Types:**
- `query` - For search queries (asymmetric search)
- `db` - For documents to be searched (database)

### Text-to-Speech (TTS)

Convert text to natural speech:

```typescript
const audioBuffer = await minimax.textToSpeech(
  '您好，这是您的屋顶检查报告。我们发现了一些需要注意的问题。',
  {
    voice: 'male-qn-qingse',   // Voice ID
    speed: 1.0,                 // Speech speed (0.5 - 2.0)
    volume: 1.0,                // Volume (0.0 - 2.0)
    pitch: 0                    // Pitch adjustment (-12 to 12)
  }
);

// Save to file
const fs = require('fs');
fs.writeFileSync('report.wav', Buffer.from(audioBuffer));
```

**Popular Voices:**
- `male-qn-qingse` - Male, clear tone (男声-青涩)
- `female-shaonv` - Female, young voice (女声-少女)
- `male-qn-jingying` - Male, professional (男声-精英)
- `female-yujie` - Female, mature (女声-御姐)

### Speech-to-Text (STT)

Transcribe audio to text:

```typescript
// Read audio file
const fs = require('fs');
const audioBuffer = fs.readFileSync('inspection.wav').buffer;

const transcription = await minimax.speechToText(audioBuffer, {
  language: 'zh',           // Language code
  model: 'speech-01'        // Model name
});

console.log(transcription);  // "这个屋顶有明显的风力损坏..."
```

### Image Generation

Generate images from text descriptions:

```typescript
const images = await minimax.generateImage(
  '一个有冰雹损坏的红色瓦片屋顶，晴天，高清照片',
  {
    model: 'text_to_image_v1',
    width: 1024,
    height: 1024,
    numImages: 1,
    guidanceScale: 7.5,
    numInferenceSteps: 50
  }
);

// images[0] contains base64 encoded image data
```

## Use Cases for Roofing

### 1. Chinese Language Support

```typescript
// Generate Chinese roofing reports
const report = await minimax.chat([
  { role: 'system', content: '你是一个专业的屋顶检查专家' },
  { role: 'user', content: '基于冰雹损坏和缺失瓦片，生成检查报告' }
]);

// Voice reports in Chinese
const voiceReport = await minimax.textToSpeech(report);
```

### 2. Semantic Search (Chinese)

```typescript
import { createQdrantConnector } from '@orpaynter/connector-qdrant';

const qdrant = createQdrantConnector({ url: QDRANT_URL, apiKey: QDRANT_KEY });

// Create collection
await qdrant.createCollection('chinese_inspections', 768, 'Cosine');

// Index Chinese inspection reports
const reports = [
  { id: 1, text: '沥青瓦片上的冰雹损坏' },
  { id: 2, text: '缺失瓦片的风力损坏' },
  { id: 3, text: '烟囱周围防水层漏水' }
];

for (const report of reports) {
  const embedding = await minimax.createEmbedding(report.text, { type: 'db' });
  await qdrant.upsert('chinese_inspections', [{
    id: report.id,
    vector: embedding,
    payload: { text: report.text }
  }]);
}

// Search in Chinese
const query = '屋顶的暴风雨损坏';
const queryEmbedding = await minimax.createEmbedding(query, { type: 'query' });
const results = await qdrant.search('chinese_inspections', {
  vector: queryEmbedding,
  limit: 5
});
```

### 3. Voice-Enabled Inspections

```typescript
// Record inspection notes via voice
const audioData = recordAudio();  // Your audio recording function
const notes = await minimax.speechToText(audioData, { language: 'zh' });

// Save to database
await saveInspectionNotes(notes);

// Generate voice report for customer
const report = await minimax.chat([
  { role: 'user', content: `基于这些检查笔记生成客户报告: ${notes}` }
]);

const voiceReport = await minimax.textToSpeech(report);
```

### 4. Multilingual Support

```typescript
// Support Chinese and English customers
const detectLanguage = (text: string) => {
  return /[\u4e00-\u9fa5]/.test(text) ? 'zh' : 'en';
};

const customerMessage = '我的屋顶漏水了';
const language = detectLanguage(customerMessage);

const response = await minimax.chat([
  { 
    role: 'system', 
    content: language === 'zh' 
      ? '你是一个专业的屋顶检查专家' 
      : 'You are a professional roofing inspector'
  },
  { role: 'user', content: customerMessage }
]);
```

## Complete Example: Chinese Roofing Assistant

```typescript
import { createMiniMaxConnector } from '@orpaynter/connector-minimax';
import { createQdrantConnector } from '@orpaynter/connector-qdrant';

const minimax = createMiniMaxConnector({
  apiKey: process.env.MINIMAX_API_KEY!,
  groupId: process.env.MINIMAX_GROUP_ID!
});

const qdrant = createQdrantConnector({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!
});

async function processInspection(audioFile: string) {
  // 1. Transcribe voice inspection
  const audioBuffer = fs.readFileSync(audioFile).buffer;
  const notes = await minimax.speechToText(audioBuffer, { language: 'zh' });
  
  // 2. Generate detailed report
  const report = await minimax.chat([
    { role: 'system', content: '你是一个专业的屋顶检查专家' },
    { role: 'user', content: `基于这些检查笔记生成详细报告: ${notes}` }
  ]);
  
  // 3. Create embedding for search
  const embedding = await minimax.createEmbedding(report, { type: 'db' });
  
  // 4. Store in vector database
  await qdrant.upsert('inspections', [{
    id: Date.now(),
    vector: embedding,
    payload: { report, notes, date: new Date().toISOString() }
  }]);
  
  // 5. Generate voice report
  const voiceReport = await minimax.textToSpeech(report);
  fs.writeFileSync('report.wav', Buffer.from(voiceReport));
  
  return { report, voiceReport };
}

// Search similar inspections
async function searchSimilarInspections(query: string) {
  const queryEmbedding = await minimax.createEmbedding(query, { type: 'query' });
  const results = await qdrant.search('inspections', {
    vector: queryEmbedding,
    limit: 5
  });
  
  return results.map(r => r.payload);
}
```

## Error Handling

```typescript
try {
  const response = await minimax.chat([
    { role: 'user', content: 'Hello' }
  ]);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('MiniMax API error:', error.response?.data);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. **Use appropriate embedding types**
   ```typescript
   // For search queries
   const queryEmb = await minimax.createEmbedding(query, { type: 'query' });
   
   // For documents
   const docEmb = await minimax.createEmbedding(doc, { type: 'db' });
   ```

2. **Batch embeddings when possible**
   ```typescript
   // Good - single API call
   const embeddings = await minimax.createEmbeddings(texts);
   
   // Bad - multiple API calls
   const embeddings = await Promise.all(
     texts.map(t => minimax.createEmbedding(t))
   );
   ```

3. **Use streaming for long responses**
   ```typescript
   const stream = minimax.chatStream(messages);
   for await (const chunk of stream) {
     // Process incrementally
   }
   ```

4. **Cache embeddings to reduce costs**

5. **Use appropriate voices for your audience**

## Models Overview

| Task | Model | Description |
|------|-------|-------------|
| Chat | `abab5.5-chat` | Fast, cost-effective Chinese LLM |
| Chat | `abab6-chat` | Advanced reasoning, better quality |
| Embeddings | `embo-01` | 768-dimensional Chinese embeddings |
| TTS | `speech-01` | Natural Chinese text-to-speech |
| STT | `speech-01` | Accurate Chinese speech recognition |
| Image | `text_to_image_v1` | Text-to-image generation |

## Environment Variables

```bash
# Required
MINIMAX_API_KEY=your_api_key
MINIMAX_GROUP_ID=your_group_id

# Optional
MINIMAX_BASE_URL=https://api.minimax.chat/v1
```

## Pricing

MiniMax offers competitive pricing for Chinese AI services:
- Chat: ~¥0.015/1K tokens
- Embeddings: ~¥0.0001/1K tokens
- TTS: ~¥0.25/1K characters
- STT: ~¥0.008/minute

## Resources

- [MiniMax Official Site](https://www.minimaxi.com/)
- [API Documentation](https://www.minimaxi.com/document/guides/chat-model)
- [Model List](https://www.minimaxi.com/document/guides/model-list)

## License

MIT
