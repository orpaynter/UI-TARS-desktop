/**
 * Hugging Face Connector for OrPaynter
 * 
 * Provides access to Hugging Face Inference API for:
 * - Text generation (LLMs)
 * - Text embeddings
 * - Image classification
 * - Object detection
 * - Question answering
 * - And more
 */

export interface HuggingFaceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface EmbeddingOptions {
  model?: string;
}

export interface ImageClassificationOptions {
  model?: string;
  topK?: number;
}

export interface ObjectDetectionOptions {
  model?: string;
  threshold?: number;
}

export interface QuestionAnsweringOptions {
  model?: string;
}

export interface HuggingFaceConnector {
  // Text Generation
  generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
  
  // Embeddings
  createEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]>;
  createEmbeddings(texts: string[], options?: EmbeddingOptions): Promise<number[][]>;
  
  // Image Classification
  classifyImage(imageUrl: string, options?: ImageClassificationOptions): Promise<Array<{ label: string; score: number }>>;
  
  // Object Detection
  detectObjects(imageUrl: string, options?: ObjectDetectionOptions): Promise<Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }>>;
  
  // Question Answering
  answerQuestion(question: string, context: string, options?: QuestionAnsweringOptions): Promise<{ answer: string; score: number }>;
  
  // Sentiment Analysis
  analyzeSentiment(text: string): Promise<Array<{ label: string; score: number }>>;
  
  // Text Summarization
  summarizeText(text: string, options?: { model?: string; maxLength?: number; minLength?: number }): Promise<string>;
  
  // Translation
  translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
}

/**
 * Create a Hugging Face connector instance
 */
export function createHuggingFaceConnector(config: HuggingFaceConfig): HuggingFaceConnector {
  const baseUrl = config.baseUrl || 'https://api-inference.huggingface.co';
  
  async function makeRequest<T>(endpoint: string, payload: any): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  return {
    async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string> {
      const model = options.model || 'gpt2';
      const result = await makeRequest<Array<{ generated_text: string }>>(`/models/${model}`, {
        inputs: prompt,
        parameters: {
          temperature: options.temperature ?? 0.7,
          max_new_tokens: options.maxTokens ?? 256,
          top_p: options.topP ?? 0.9,
          stop_sequence: options.stopSequences,
        },
      });
      
      return result[0]?.generated_text || '';
    },
    
    async createEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
      const model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
      const result = await makeRequest<number[]>(`/models/${model}`, {
        inputs: text,
      });
      
      return result;
    },
    
    async createEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<number[][]> {
      const model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
      const result = await makeRequest<number[][]>(`/models/${model}`, {
        inputs: texts,
      });
      
      return result;
    },
    
    async classifyImage(imageUrl: string, options: ImageClassificationOptions = {}): Promise<Array<{ label: string; score: number }>> {
      const model = options.model || 'google/vit-base-patch16-224';
      
      // Fetch image and convert to blob
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      const response = await fetch(`${baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Image classification error: ${response.statusText}`);
      }
      
      const result = await response.json() as Array<{ label: string; score: number }>;
      
      if (options.topK) {
        return result.slice(0, options.topK);
      }
      
      return result;
    },
    
    async detectObjects(imageUrl: string, options: ObjectDetectionOptions = {}): Promise<Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }>> {
      const model = options.model || 'facebook/detr-resnet-50';
      
      // Fetch image and convert to blob
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      const formData = new FormData();
      formData.append('file', imageBlob);
      
      const response = await fetch(`${baseUrl}/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Object detection error: ${response.statusText}`);
      }
      
      const result = await response.json() as Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }>;
      
      if (options.threshold) {
        return result.filter(obj => obj.score >= options.threshold!);
      }
      
      return result;
    },
    
    async answerQuestion(question: string, context: string, options: QuestionAnsweringOptions = {}): Promise<{ answer: string; score: number }> {
      const model = options.model || 'deepset/roberta-base-squad2';
      const result = await makeRequest<{ answer: string; score: number }>(`/models/${model}`, {
        inputs: {
          question,
          context,
        },
      });
      
      return result;
    },
    
    async analyzeSentiment(text: string): Promise<Array<{ label: string; score: number }>> {
      const model = 'distilbert-base-uncased-finetuned-sst-2-english';
      const result = await makeRequest<Array<Array<{ label: string; score: number }>>>(`/models/${model}`, {
        inputs: text,
      });
      
      return result[0] || [];
    },
    
    async summarizeText(text: string, options: { model?: string; maxLength?: number; minLength?: number } = {}): Promise<string> {
      const model = options.model || 'facebook/bart-large-cnn';
      const result = await makeRequest<Array<{ summary_text: string }>>(`/models/${model}`, {
        inputs: text,
        parameters: {
          max_length: options.maxLength ?? 130,
          min_length: options.minLength ?? 30,
        },
      });
      
      return result[0]?.summary_text || '';
    },
    
    async translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
      const model = `Helsinki-NLP/opus-mt-${sourceLanguage}-${targetLanguage}`;
      const result = await makeRequest<Array<{ translation_text: string }>>(`/models/${model}`, {
        inputs: text,
      });
      
      return result[0]?.translation_text || '';
    },
  };
}
