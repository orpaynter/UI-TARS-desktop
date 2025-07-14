import {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ResponseCreateParams,
  OpenAI,
  EasyInputMessage,
} from '@multimodal/agent-interface';
import { getLogger } from './logger';

interface CachedResponseInfo {
  responseId: string;
  timestamp: number;
  hasImages: boolean;
  messageContent?: string;
}

interface ResponseCacheConfig {
  enableCache: boolean;
  maxSize: number;
  deleteTimeout: number;
}

export class ResponseIdCache {
  private cache: CachedResponseInfo[] = [];
  private llmClient?: OpenAI;
  private logger = getLogger('ResponseIdCache');
  private deleteTimeSamples: number[] = [];
  private config: ResponseCacheConfig;

  constructor(llmClient?: OpenAI, config?: Partial<ResponseCacheConfig>) {
    this.llmClient = llmClient;
    this.config = {
      enableCache: true,
      maxSize: 5,
      deleteTimeout: 10000,
      ...config,
    };

    this.logger.info(`[ResponseCache] Initialized with config:`, this.config);
  }

  setLLMClient(client: OpenAI): void {
    this.llmClient = client;
    this.logger.debug('[ResponseCache] LLM client updated');
  }

  async checkAndCleanupBeforeNewMessage(): Promise<void> {
    if (!this.config.enableCache) {
      return;
    }

    this.logger.info(
      'responseCache before clean: ',
      this.cache.map((c) => c.responseId),
    );

    if (this.cache.length > this.config.maxSize) {
      this.logger.info(
        `[ResponseCache] Cache size ${this.cache.length} exceeds limit ${this.config.maxSize}, cleaning up...`,
      );
      await this.cleanupOldResponses();
    }
  }

  addResponseId(responseId: string, messages?: ResponseCreateParams): void {
    if (!this.config.enableCache) {
      return;
    }

    const hasImages = messages ? this.hasImagesInMessages(messages) : false;

    if (!hasImages) {
      this.logger.debug(
        `[ResponseCache] Skipping cache for response ${responseId} - no images detected`,
      );
      return;
    }

    const cachedInfo: CachedResponseInfo = {
      responseId,
      timestamp: Date.now(),
      hasImages,
      // messageContent: this.extractMessageContent(messages),
    };

    this.cache.push(cachedInfo);

    this.logger.info(
      `[ResponseCache] Added response ${responseId} to cache. Cache size: ${this.cache.length}, current ids: ${this.cache.map((item) => item.responseId).join(',')}`,
    );
  }

  private async cleanupOldResponses(): Promise<void> {
    while (this.cache.length > this.config.maxSize) {
      // 取出数组第二个元素（索引为1），如果不存在则取第一个元素
      const indexToRemove = this.cache.length > 1 ? 1 : 0;
      const responseToDelete = this.cache.splice(indexToRemove, 1)[0];
      if (responseToDelete) {
        await this.deleteResponseWithRetry(responseToDelete.responseId);
      }
    }
  }

  private async deleteResponseWithRetry(responseId: string): Promise<void> {
    if (!this.llmClient) {
      this.logger.warn(
        `[ResponseCache] No LLM client available for deleting response ${responseId}`,
      );
      return;
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    try {
      this.logger.debug(`[ResponseCache] Attempting to delete response ${responseId}`);

      //TODO:
      const res = await this.llmClient.responses.delete(responseId);

      const deleteTime = Date.now() - startTime;
      this.updateAverageDeleteTime(deleteTime);

      this.logger.info(
        `[ResponseCache] Successfully deleted response ${responseId} in ${deleteTime}ms `,
        res,
      );
      return;
    } catch (error) {
      lastError = error as Error;
      this.logger.warn(`[ResponseCache] Failed to delete response ${responseId}:`, error);
    }
  }

  private hasImagesInMessages(params: ResponseCreateParams): boolean {
    if (!params.input || typeof params.input === 'string') {
      return false;
    }

    const inputArray = params.input;
    if (!Array.isArray(inputArray)) {
      return false;
    }

    return inputArray.some((inputItem) => {
      // Check the message content of EasyInputMessage type
      if ('content' in inputItem && 'role' in inputItem) {
        const messageItem = inputItem as EasyInputMessage;
        if (Array.isArray(messageItem.content)) {
          return messageItem.content.some((contentPart) => {
            return contentPart.type === 'input_image';
          });
        }
      }

      // Check ResponseInputItem.Message type
      if (inputItem.type === 'message' && 'content' in inputItem) {
        const messageContent = (inputItem as any).content;
        if (Array.isArray(messageContent)) {
          return messageContent.some((contentPart: any) => {
            return contentPart.type === 'input_image';
          });
        }
      }

      return false;
    });
  }

  private hasImagesInContent(content: ChatCompletionContentPart): boolean {
    return content.type === 'image_url';
  }

  private extractMessageContent(messages?: ChatCompletionMessageParam[]): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    return messages
      .map((message) => {
        if (typeof message.content === 'string') {
          return message.content;
        }
        if (Array.isArray(message.content)) {
          return message.content
            .filter((part) => part.type === 'text')
            .map((part) => (part as any).text)
            .join(' ');
        }
        return '';
      })
      .join(' ')
      .substring(0, 200);
  }

  private updateAverageDeleteTime(deleteTime: number): void {
    this.deleteTimeSamples.push(deleteTime);

    if (this.deleteTimeSamples.length > 10) {
      this.deleteTimeSamples.shift();
    }
  }

  getCacheInfo(): { size: number; items: CachedResponseInfo[] } {
    return {
      size: this.cache.length,
      items: [...this.cache],
    };
  }

  getConfig(): ResponseCacheConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ResponseCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('[ResponseCache] Configuration updated:', this.config);
  }

  clear(): void {
    this.cache = [];
    this.logger.info('[ResponseCache] Cache cleared');
  }
}
