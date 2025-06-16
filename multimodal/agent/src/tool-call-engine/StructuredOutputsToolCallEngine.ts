/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ToolCallEngine,
  ToolDefinition,
  PrepareRequestContext,
  ChatCompletionCreateParams,
  ChatCompletionChunk,
  MultimodalToolCallResult,
  AgentSingleLoopReponse,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ParsedModelResponse,
  StreamProcessingState,
  StreamChunkResult,
  FinishReason,
} from '@multimodal/agent-interface';
import { zodToJsonSchema } from '../utils';
import { getLogger } from '../utils/logger';
import { buildToolCallResultMessages } from './utils';
import { jsonrepair } from 'jsonrepair';

/**
 * Represents the structured response format that the LLM should return
 * when using the StructuredOutputsToolCallEngine.
 *
 * This interface defines two distinct response patterns:
 * 1. Tool calling scenario: Uses 'thought' + 'toolCall' fields
 * 2. Final answer scenario: Uses 'finalAnswer' field
 *
 * The separation ensures semantic clarity and prevents the model from
 * confusing reasoning processes with final user-facing responses.
 */
interface StructuredAgentResponse {
  /**
   * The agent's reasoning and thinking process when it needs to call a tool.
   * This field contains explanations of why a specific tool is needed and
   * how it will help solve the user's request.
   *
   * Should be present when toolCall is provided.
   */
  thought?: string;

  /**
   * Tool invocation details when the agent needs to use a tool.
   * Contains the exact tool name and its required arguments.
   *
   * Should be present together with 'thought' field.
   */
  toolCall?: {
    /**
     * The exact name of the tool to invoke.
     * Must match one of the available tool definitions.
     */
    name: string;

    /**
     * Arguments to pass to the tool call.
     * Structure should match the tool's parameter schema.
     */
    args: Record<string, unknown>;
  };

  /**
   * The complete response to provide to the user when no tool call is needed.
   * This should be a comprehensive, helpful answer that directly addresses
   * the user's question or request.
   *
   * Should be used instead of 'thought' + 'toolCall' when providing final answers.
   */
  finalAnswer?: string;
}

/**
 * StructuredOutputsToolCallEngine - Uses structured outputs (JSON Schema) for tool calls
 *
 * This design eliminates semantic ambiguity by clearly separating reasoning from final answers,
 * preventing models from confusing when to provide explanations vs. final responses.
 */
export class StructuredOutputsToolCallEngine implements ToolCallEngine {
  private logger = getLogger('StructuredOutputsToolCallEngine');

  /**
   * Prepare the system prompt with tool definitions and clear instructions
   * for the structured output format with separated thought and finalAnswer fields
   *
   * @param basePrompt The base system prompt
   * @param tools Available tools for the agent
   * @returns Enhanced system prompt with tool information and structured output instructions
   */
  preparePrompt(basePrompt: string, tools: ToolDefinition[]): string {
    if (!tools.length) {
      return basePrompt;
    }

    // Define tools section
    const toolsSection = tools
      .map((tool) => {
        const schema = tool.hasJsonSchema?.() ? tool.schema : zodToJsonSchema(tool.schema);

        return `
Tool name: ${tool.name}
Description: ${tool.description}
Parameters: ${JSON.stringify(schema, null, 2)}`;
      })
      .join('\n\n');

    // Define instructions for using structured outputs with separated semantics
    const structuredOutputInstructions = `
When you need to use a tool:
{
  "thought": "Explain your reasoning and why you need to call this specific tool",
  "toolCall": {
    "name": "the_exact_tool_name",
    "args": {
      // The arguments as required by the tool's parameter schema
    }
  }
}

When you want to provide a final answer without calling any tool:
{
  "finalAnswer": "Your complete and helpful response to the user"
}

IMPORTANT: 
- Use "thought" + "toolCall" when you need to call a tool
- Use "finalAnswer" when providing the final response
- Never mix these patterns - they serve different purposes`;

    // Combine everything
    return `${basePrompt}

AVAILABLE TOOLS:
${toolsSection}

${structuredOutputInstructions}`;
  }

  /**
   * Prepare the request parameters for the LLM call with updated JSON schema
   *
   * @param context The request context
   * @returns ChatCompletionCreateParams with structured outputs configuration
   */
  prepareRequest(context: PrepareRequestContext): ChatCompletionCreateParams {
    // Define the schema for structured outputs with separated semantics
    const responseSchema = {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: 'Your reasoning and thinking process when calling a tool',
        },
        toolCall: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The exact name of the tool to call',
            },
            args: {
              type: 'object',
              description: 'The arguments for the tool call',
            },
          },
          required: ['name', 'args'],
        },
        finalAnswer: {
          // OpenAI recommends list of types.
          // @see https://platform.openai.com/docs/guides/structured-outputs?api-mode=chat&example=chain-of-thought
          //
          // Volcengine does not support a list of types
          // Error: 400 Invalid decoding guidance syntax: A list of types is not supported yet at path '$.properties.finalAnswer
          // type: ['string', 'null'],
          type: 'string',
          description:
            'Your final complete response to the user when no tool call is needed, returns an empty string when toolCall exists.',
        },
      },
      required: ['thought', 'toolCall', 'finalAnswer'],
      additionalProperties: false,
    };

    // Basic parameters
    const params: ChatCompletionCreateParams = {
      messages: context.messages,
      model: context.model,
      temperature: context.temperature || 0.7,
      stream: true,
    };

    // Add tools if available
    if (context.tools && context.tools.length > 0) {
      params.response_format = {
        type: 'json_schema',
        // @ts-expect-error
        strict: true,
        json_schema: {
          name: 'agent_schema',
          strict: true,
          schema: responseSchema,
        },
      };
    }

    return params;
  }

  /**
   * Initialize stream processing state for structured outputs
   * Adding lastExtractedContent to track what's been extracted from JSON for incremental updates
   */
  initStreamProcessingState(): StreamProcessingState {
    return {
      contentBuffer: '',
      toolCalls: [],
      reasoningBuffer: '',
      finishReason: null,
      lastParsedContent: '', // Tracks the last successfully extracted content
    };
  }

  /**
   * Process a streaming chunk for structured outputs with separated thought/finalAnswer handling
   * Improved to handle both thought and finalAnswer fields appropriately
   */
  processStreamingChunk(
    chunk: ChatCompletionChunk,
    state: StreamProcessingState,
  ): StreamChunkResult {
    const delta = chunk.choices[0]?.delta;
    let content = '';
    let reasoningContent = '';
    let hasToolCallUpdate = false;

    // Extract finish reason if present
    if (chunk.choices[0]?.finish_reason) {
      state.finishReason = chunk.choices[0].finish_reason;
    }

    // Process reasoning content if present
    // @ts-expect-error Not in OpenAI types but present in compatible LLMs
    if (delta?.reasoning_content) {
      // @ts-expect-error
      reasoningContent = delta.reasoning_content;
      state.reasoningBuffer += reasoningContent;
    }

    // Process regular content
    if (delta?.content) {
      const newContent = delta.content;

      // Accumulate new content in buffer for JSON parsing
      state.contentBuffer += newContent;

      // Try to extract content from JSON as it comes in
      if (this.mightBeCollectingJson(state.contentBuffer)) {
        try {
          // Try to repair and parse the potentially incomplete JSON
          const repairedJson = jsonrepair(state.contentBuffer);
          const parsed: StructuredAgentResponse = JSON.parse(repairedJson);

          if (parsed) {
            // Handle tool call scenario - extract thought
            if (parsed.thought && typeof parsed.thought === 'string') {
              // Calculate only the new incremental thought content
              const newExtractedContent = parsed.thought.slice(
                state.lastParsedContent?.length || 0,
              );

              // Only send if we have new incremental content
              if (newExtractedContent) {
                content = newExtractedContent;
                // Update the last parsed content to the full thought
                state.lastParsedContent = parsed.thought;
              }

              // Check for tool call
              if (parsed.toolCall && parsed.toolCall.name && !hasToolCallUpdate) {
                const { name, args } = parsed.toolCall;

                // Create a tool call and update state
                const toolCall: ChatCompletionMessageToolCall = {
                  id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  type: 'function',
                  function: {
                    name,
                    arguments: JSON.stringify(args),
                  },
                };

                state.toolCalls = [toolCall];
                hasToolCallUpdate = true;
              }
            }
            // Handle final answer scenario
            else if (parsed.finalAnswer && typeof parsed.finalAnswer === 'string') {
              // Calculate only the new incremental final answer content
              const newExtractedContent = parsed.finalAnswer.slice(
                state.lastParsedContent?.length || 0,
              );

              // Only send if we have new incremental content
              if (newExtractedContent) {
                content = newExtractedContent;
                // Update the last parsed content to the full final answer
                state.lastParsedContent = parsed.finalAnswer;
              }
            }
          }
        } catch (e) {
          // JSON parsing failed - this is expected for incomplete JSON
          // Don't send any content in this case
          content = '';
        }
      } else {
        // If not collecting JSON, pass through the content directly
        content = newContent;
      }
    }

    return {
      content,
      reasoningContent,
      hasToolCallUpdate,
      toolCalls: state.toolCalls,
    };
  }

  /**
   * Finalize the stream processing and extract the final response
   * Updated to handle both thought and finalAnswer fields
   */
  finalizeStreamProcessing(state: StreamProcessingState): ParsedModelResponse {
    console.log('---!!!state.contentBuffer----\n', state.contentBuffer);
    console.log('---');

    // One final attempt to parse JSON
    try {
      const repairedJson = jsonrepair(state.contentBuffer);
      const parsed: StructuredAgentResponse = JSON.parse(repairedJson);

      if (parsed) {
        /**
         * In structured output, the output will be { "toolCall": { "name": "", "args": {} } }
         * We need to skip it.
         */
        if (parsed.toolCall && parsed.toolCall.name) {
          // Found a tool call in the JSON
          const { name, args } = parsed.toolCall;

          // Create a tool call
          const toolCall: ChatCompletionMessageToolCall = {
            id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'function',
            function: {
              name,
              arguments: JSON.stringify(args),
            },
          };

          state.toolCalls = [toolCall];

          // For tool call responses, return the thought as content
          if (parsed.thought) {
            state.contentBuffer = parsed.thought;
          } else {
            state.contentBuffer = '';
          }
        }

        if (parsed.finalAnswer) {
          // No tool call, use final answer as content
          state.contentBuffer = parsed.finalAnswer;
        } else if (parsed.thought) {
          // Edge case: thought without tool call - treat as regular content
          state.contentBuffer = parsed.thought;
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to parse JSON in final processing: ${e}`);
    }

    const finishReason: FinishReason =
      state.toolCalls.length > 0 ? 'tool_calls' : state.finishReason || 'stop';

    return {
      content: state.contentBuffer,
      reasoningContent: state.reasoningBuffer || undefined,
      toolCalls: state.toolCalls.length > 0 ? state.toolCalls : undefined,
      finishReason,
    };
  }

  /**
   * Check if the text might be in the process of building a JSON object
   */
  private mightBeCollectingJson(text: string): boolean {
    // If it contains an opening brace but not a balancing number of closing braces
    return text.includes('{');
  }

  /**
   * Build a historical assistant message for conversation history
   *
   * For structured outputs, we maintain the original content without tool_calls
   * to ensure compatibility with our JSON schema approach.
   *
   * @param response The agent's response
   * @returns Formatted message parameter for conversation history
   */
  buildHistoricalAssistantMessage(response: AgentSingleLoopReponse): ChatCompletionMessageParam {
    // For structured outputs, we never use the tool_calls field
    // Instead, the JSON structure is already in the content
    return {
      role: 'assistant',
      content: response.content || '',
    };
  }

  /**
   * Build historical tool call result messages for conversation history
   *
   * For structured outputs engine, we format results as user messages
   * to maintain consistency with our JSON schema approach.
   *
   * @param results The tool call results
   * @returns Array of formatted message parameters
   */
  buildHistoricalToolCallResultMessages(
    results: MultimodalToolCallResult[],
  ): ChatCompletionMessageParam[] {
    return buildToolCallResultMessages(results, false);
  }
}
