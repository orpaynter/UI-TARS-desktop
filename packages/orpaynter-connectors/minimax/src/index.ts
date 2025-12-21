/**
 * MiniMax AI Connector for OrPaynter
 * 
 * Provides access to MiniMax AI services for:
 * - Chat completion (Chinese and multilingual LLMs)
 * - Text embeddings
 * - Text-to-speech
 * - Speech-to-text
 * - Image generation
 */

import axios, { AxiosInstance } from 'axios';

export interface MiniMaxConfig {
  apiKey: string;
  groupId: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface EmbeddingOptions {
  model?: string;
  type?: 'query' | 'db';
}

export interface TextToSpeechOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  pitch?: number;
}

export interface SpeechToTextOptions {
  language?: string;
  model?: string;
}

export interface ImageGenerationOptions {
  model?: string;
  width?: number;
  height?: number;
  numImages?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
}

export interface MiniMaxConnector {
  // Chat Completion
  chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<string>;
  chatStream(messages: ChatMessage[], options?: ChatCompletionOptions): AsyncIterable<string>;
  
  // Embeddings
  createEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]>;
  createEmbeddings(texts: string[], options?: EmbeddingOptions): Promise<number[][]>;
  
  // Text-to-Speech
  textToSpeech(text: string, options?: TextToSpeechOptions): Promise<ArrayBuffer>;
  
  // Speech-to-Text
  speechToText(audioData: ArrayBuffer, options?: SpeechToTextOptions): Promise<string>;
  
  // Image Generation
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string[]>;
}

/**
 * Create a MiniMax connector instance
 */
export function createMiniMaxConnector(config: MiniMaxConfig): MiniMaxConnector {
  const baseUrl = config.baseUrl || 'https://api.minimax.chat/v1';
  
  const client: AxiosInstance = axios.create({
    baseURL: baseUrl,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  return {
    async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<string> {
      const model = options.model || 'abab5.5-chat';
      
      const response = await client.post(`/text/chatcompletion_v2`, {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
        max_tokens: options.maxTokens ?? 2048,
        stream: false,
      }, {
        params: {
          GroupId: config.groupId,
        },
      });
      
      return response.data.choices[0]?.message?.content || '';
    },
    
    async *chatStream(messages: ChatMessage[], options: ChatCompletionOptions = {}): AsyncIterable<string> {
      const model = options.model || 'abab5.5-chat';
      
      const response = await client.post(`/text/chatcompletion_v2`, {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
      }, {
        params: {
          GroupId: config.groupId,
        },
        responseType: 'stream',
      });
      
      // Parse SSE stream
      const stream = response.data;
      let buffer = '';
      
      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    },
    
    async createEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
      const model = options.model || 'embo-01';
      const type = options.type || 'db';
      
      const response = await client.post(`/embeddings`, {
        model,
        texts: [text],
        type,
      }, {
        params: {
          GroupId: config.groupId,
        },
      });
      
      return response.data.vectors[0] || [];
    },
    
    async createEmbeddings(texts: string[], options: EmbeddingOptions = {}): Promise<number[][]> {
      const model = options.model || 'embo-01';
      const type = options.type || 'db';
      
      const response = await client.post(`/embeddings`, {
        model,
        texts,
        type,
      }, {
        params: {
          GroupId: config.groupId,
        },
      });
      
      return response.data.vectors || [];
    },
    
    async textToSpeech(text: string, options: TextToSpeechOptions = {}): Promise<ArrayBuffer> {
      const response = await client.post(`/text_to_speech`, {
        text,
        voice_id: options.voice || 'male-qn-qingse',
        speed: options.speed ?? 1.0,
        vol: options.volume ?? 1.0,
        pitch: options.pitch ?? 0,
        model: 'speech-01',
      }, {
        params: {
          GroupId: config.groupId,
        },
        responseType: 'arraybuffer',
      });
      
      return response.data;
    },
    
    async speechToText(audioData: ArrayBuffer, options: SpeechToTextOptions = {}): Promise<string> {
      const formData = new FormData();
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', options.model || 'speech-01');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      
      const response = await client.post(`/speech_to_text`, formData, {
        params: {
          GroupId: config.groupId,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.text || '';
    },
    
    async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<string[]> {
      const model = options.model || 'text_to_image_v1';
      
      const response = await client.post(`/text_to_image`, {
        model,
        prompt,
        width: options.width ?? 1024,
        height: options.height ?? 1024,
        num_images: options.numImages ?? 1,
        guidance_scale: options.guidanceScale ?? 7.5,
        num_inference_steps: options.numInferenceSteps ?? 50,
      }, {
        params: {
          GroupId: config.groupId,
        },
      });
      
      return response.data.images || [];
    },
  };
}
