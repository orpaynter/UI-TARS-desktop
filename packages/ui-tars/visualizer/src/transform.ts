/**
 * Copyright (c) 2024-present Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: MIT
 */
import { EnhancedGroupedActionDump } from './component/store';

interface ExecutionDumpWithPlaywrightAttributes
  extends EnhancedGroupedActionDump {
  attributes: Record<string, string>;
}

interface ComputerUseConversation {
  from: 'human' | 'gpt';
  value: string;
  timing: unknown;
  screenshotBase64?: string[];
  screenshotBase64WithElementMarker?: string;
  predictionParsed?: Array<{
    action_type: string;
    action_inputs: unknown;
  }>;
}

interface ComputerUseData {
  instruction: string;
  systemPrompt: string;
  modelDetail: string;
  version: string;
  modelName: string;
  logTime: string;
  conversations: ComputerUseConversation[];
}

const addBase64ImagePrefix = (base64: string) => {
  if (!base64) return '';

  return base64.startsWith('data:')
    ? base64
    : `data:image/png;base64,${base64}`;
};

export function transformComputerUseDataToDump(
  data: ComputerUseData,
): ExecutionDumpWithPlaywrightAttributes {
  return {
    groupName: data.instruction,
    groupDescription: '',
    systemPrompt: data.systemPrompt,
    modelDetail: data.modelDetail,
    executions: [
      {
        sdkVersion: data.version,
        model_name: data.modelName,
        logTime: data.logTime,
        name: data.instruction,
        tasks: data.conversations
          .map((conv: ComputerUseConversation, index: number) => {
            if (conv.from === 'human') {
              return {
                status: 'finished',
                type: conv.value === '<image>' ? 'screenshot' : 'instruction',
                timing: conv.timing,
                value: conv.value,
                pageContext: {
                  screenshotBase64: addBase64ImagePrefix(
                    conv.screenshotBase64 || '',
                  ),
                  screenshotBase64WithElementMarker: addBase64ImagePrefix(
                    conv.screenshotBase64WithElementMarker || '',
                  ),
                  size: conv.screenshotContext?.size || { width: 0, height: 0 },
                },
                recorder: [
                  {
                    type:
                      conv.value === '<image>' ? 'screenshot' : 'instruction',
                    ts: conv.timing.start,
                    screenshot: addBase64ImagePrefix(
                      conv.screenshotBase64 || '',
                    ),
                    timing: 'before screenshot',
                  },
                ],
              };
            }

            if (conv.from === 'gpt') {
              const actions = conv.predictionParsed?.map((a) => {
                return {
                  type: a.action_type,
                  input: JSON.stringify(a.action_inputs),
                };
              });

              return {
                status: 'finished',
                type: 'action',
                timing: conv.timing,
                value: conv.value,
                actions: actions,
                recorder: [
                  ...(conv.screenshotBase64
                    ? [
                        {
                          type: 'screenshot',
                          ts: conv.timing.start,
                          screenshot: addBase64ImagePrefix(
                            conv.screenshotBase64 || '',
                          ),
                          timing: 'before screenshot',
                        },
                      ]
                    : []),
                  ...(conv.screenshotBase64WithElementMarker
                    ? [
                        {
                          type: 'screenshot',
                          ts: conv.timing.start,
                          screenshot: addBase64ImagePrefix(
                            conv.screenshotBase64WithElementMarker || '',
                          ),
                          timing: 'after screenshot',
                        },
                      ]
                    : []),
                ],
              };
            }

            return null;
          })
          .filter(
            (task: unknown): task is NonNullable<typeof task> => task !== null,
          ),
      },
    ],
    attributes: {},
  };
}
