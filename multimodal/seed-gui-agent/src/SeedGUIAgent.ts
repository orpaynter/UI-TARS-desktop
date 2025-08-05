/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Operator } from '@ui-tars/sdk/core';
import { Agent, LLMRequestHookPayload, LogLevel, Tool } from '@tarko/agent';
import { SeedGUIAgentToolCallEngine } from './SeedGUIAgentToolCallEngine';
import { SYSTEM_PROMPT } from './constants';
import { getScreenInfo, setScreenInfo } from './shared';
import { ImageSaver } from './utils/ImageSaver';

const addBase64ImagePrefix = (base64: string) => {
  if (!base64) return '';
  return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
};

export interface GUIAgentConfig<TOperator> {
  operator: TOperator;
  model: {
    baseURL: string;
    id: string;
    apiKey: string;
    uiTarsVersion?:
      | 'ui-tars-1.0'
      | 'ui-tars-1.5'
      | 'doubao-1.5-ui-tars-15b'
      | 'doubao-1.5-ui-tars-20b';
  };
  // ===== Optional =====
  systemPrompt?: string;
  signal?: AbortSignal;
  maxLoopCount?: number;
  loopIntervalInMs?: number;
}

export class SeedGUIAgent<T extends Operator> extends Agent {
  static label = 'Seed GUI Agent';

  private operator: Operator;

  constructor(config: GUIAgentConfig<T>) {
    const { operator, model, systemPrompt, signal, maxLoopCount, loopIntervalInMs } = config;
    super({
      name: 'Browser GUI Agent',
      instructions: systemPrompt ?? SYSTEM_PROMPT,
      tools: [],
      toolCallEngine: SeedGUIAgentToolCallEngine,
      model: {
        provider: 'volcengine',
        baseURL: model?.baseURL,
        id: model?.id,
        apiKey: model?.apiKey,
      },
      maxIterations: maxLoopCount ?? 100,
      logLevel: LogLevel.DEBUG,
    });

    const logger = this.logger;

    this.operator = operator;

    logger.setLevel(LogLevel.DEBUG);
  }

  async initialize() {
    this.registerTool(
      new Tool({
        id: 'operator-adaptor-tool',
        description: 'operator tool',
        parameters: {},
        function: async (input) => {
          console.log(input);
          await this.operator.execute({
            parsedPrediction: input,
            screenWidth: getScreenInfo().screenWidth ?? 1000,
            screenHeight: getScreenInfo().screenHeight ?? 1000,
            prediction: input,
            scaleFactor: 1000,
            factors: [1, 1],
          });
        },
      }),
    );
    super.initialize();
  }

  async onLLMRequest(id: string, payload: LLMRequestHookPayload): Promise<void> {
    console.log('onLLMRequest', id, payload);
    await ImageSaver.saveImagesFromPayload(id, payload);
  }

  async onEachAgentLoopStart(sessionId: string) {
    const output = await this.operator.screenshot();
    const event = this.eventStream.createEvent('environment_input', {
      description: 'Browser Screenshot',
      content: [
        {
          type: 'text',
          text: 'Screenshot: ',
        },
        {
          type: 'image_url',
          image_url: {
            url: addBase64ImagePrefix(output.base64),
          },
        },
      ],
    });

    // Extract image dimensions from screenshot
    this.extractImageDimensionsFromBase64(output.base64);
    this.eventStream.sendEvent(event);
  }

  async onAgentLoopEnd(id: string): Promise<void> {
    // await this.browserOperator.cleanup();
  }

  /**
   * Extract width and height information from base64 encoded image
   */
  private extractImageDimensionsFromBase64(base64String: string): void {
    // Remove base64 prefix (if any)
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to binary data
    const buffer = Buffer.from(base64Data, 'base64');

    // Check image type and extract dimensions
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      // PNG format: width in bytes 16-19, height in bytes 20-23
      setScreenInfo({
        screenWidth: buffer.readUInt32BE(16),
        screenHeight: buffer.readUInt32BE(20),
      });
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      // JPEG format: need to parse SOF0 marker (0xFFC0)
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;

        const marker = buffer[offset + 1];
        const segmentLength = buffer.readUInt16BE(offset + 2);

        // SOF0, SOF2 markers contain dimension information
        if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)) {
          setScreenInfo({
            screenHeight: buffer.readUInt16BE(offset + 5),
            screenWidth: buffer.readUInt16BE(offset + 7),
          });
          break;
        }

        offset += 2 + segmentLength;
      }
    }
  }
}
