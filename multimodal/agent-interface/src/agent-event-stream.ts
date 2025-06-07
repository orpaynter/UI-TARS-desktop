/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChatCompletionContentPart,
  ChatCompletionMessageToolCall,
} from '@multimodal/model-provider/types';
import { AgentSingleLoopReponse } from './agent-instance';

/**
 * AgentEventStream namespace - Defines all event types and structures for the Agent framework's internal event stream
 *
 * This namespace contains event definitions used internally by the Agent framework for memory construction,
 * state management, and UI updates. Unlike Agio which focuses on server-side monitoring, AgentEventStream
 * handles the granular conversation flow within individual agent sessions.
 *
 * Key design principles:
 * - String-based event types for better JSON serialization compatibility
 * - Hierarchical categorization of events by functional area
 * - Strict typing for all event payloads
 * - Support for both real-time streaming and batch processing scenarios
 */
export namespace AgentEventStream {
  /**
   * Event type categories for the Agent framework's internal event stream
   *
   * These events track the detailed conversation flow and state changes
   * within individual agent sessions, providing granular visibility into
   * the agent's reasoning and execution process.
   */
  export type EventType =
    /**
     * Conversation flow events - track the primary dialogue between user and assistant
     */
    | 'user_message'
    | 'assistant_message'
    | 'assistant_thinking_message'

    /**
     * Real-time streaming events - for live updates during agent execution
     */
    | 'assistant_streaming_message'
    | 'assistant_streaming_thinking_message'

    /**
     * Tool execution events - track individual tool calls and their results
     */
    | 'tool_call'
    | 'tool_result'

    /**
     * System and lifecycle events - track agent state and execution flow
     */
    | 'system'
    | 'agent_run_start'
    | 'agent_run_end'

    /**
     * Environment and context events - for external inputs and planning
     */
    | 'environment_input'
    | 'plan_start'
    | 'plan_update'
    | 'plan_finish'

    /**
     * Final output events - for structured final answers and reports
     */
    | 'final_answer'
    | 'final_answer_streaming';

  /**
   * Base properties that all agent events inherit
   */
  export interface BaseEvent {
    /** Unique identifier for this event */
    id: string;

    /** The type of event */
    type: EventType;

    /** Timestamp when the event was created */
    timestamp: number;
  }

  /**
   * User message event - represents input from the user
   */
  export interface UserMessageEvent extends BaseEvent {
    type: 'user_message';

    /** User's input content (can be text or multimodal) */
    content: string | ChatCompletionContentPart[];
  }

  /**
   * Assistant message event - represents the agent's response
   */
  export interface AssistantMessageEvent extends BaseEvent {
    type: 'assistant_message';

    /** The assistant's response content */
    content: string;

    /** Tool calls made by the assistant (if any) */
    toolCalls?: ChatCompletionMessageToolCall[];

    /** How the response was finished */
    finishReason?: string;

    /** Time taken to generate this response */
    elapsedMs?: number;

    /**
     * Unique message identifier that links streaming messages to their final message
     * This allows clients to correlate incremental updates with complete messages
     */
    messageId?: string;
  }

  /**
   * Assistant thinking message event - represents the agent's reasoning process
   */
  export interface AssistantThinkingMessageEvent extends BaseEvent {
    type: 'assistant_thinking_message';

    /** The reasoning content */
    content: string;

    /** Whether the thinking process is complete */
    isComplete?: boolean;
  }

  /**
   * Assistant streaming message event - for real-time content updates
   */
  export interface AssistantStreamingMessageEvent extends BaseEvent {
    type: 'assistant_streaming_message';

    /** Incremental content chunk */
    content: string;

    /** Whether this is the final chunk */
    isComplete?: boolean;

    /**
     * Unique message identifier that links streaming messages to their final message
     * This allows clients to correlate incremental updates with complete messages
     */
    messageId?: string;
  }

  /**
   * Assistant streaming thinking message event - for real-time reasoning updates
   */
  export interface AssistantStreamingThinkingMessageEvent extends BaseEvent {
    type: 'assistant_streaming_thinking_message';

    /** Incremental reasoning content chunk */
    content: string;

    /** Whether this is the final reasoning chunk */
    isComplete?: boolean;
  }

  /**
   * Tool call event - represents a tool being invoked
   */
  export interface ToolCallEvent extends BaseEvent {
    type: 'tool_call';

    /** Unique identifier for this tool call */
    toolCallId: string;

    /** Name of the tool being called */
    name: string;

    /** Arguments passed to the tool */
    arguments: Record<string, any>;

    /** When the tool call started */
    startTime: number;

    /** Metadata about the tool */
    tool: {
      name: string;
      description: string;
      schema: any;
    };
  }

  /**
   * Tool result event - represents the result of a tool execution
   */
  export interface ToolResultEvent extends BaseEvent {
    type: 'tool_result';

    /** Unique identifier for the corresponding tool call */
    toolCallId: string;

    /** Name of the tool that was executed */
    name: string;

    /** The result content from the tool */
    content: any;

    /** Processed multimodal content (if applicable) */
    processedContent?: ChatCompletionContentPart[];

    /** Time taken to execute the tool */
    elapsedMs: number;

    /** Error message if the tool execution failed */
    error?: string;
  }

  /**
   * System event - for logs, warnings, and system messages
   */
  export interface SystemEvent extends BaseEvent {
    type: 'system';

    /** Severity level of the message */
    level: 'info' | 'warning' | 'error';

    /** The system message */
    message: string;

    /** Additional details about the event */
    details?: Record<string, any>;
  }

  /**
   * Agent run start event - marks the beginning of an agent execution session
   */
  export interface AgentRunStartEvent extends BaseEvent {
    type: 'agent_run_start';

    /** Unique session identifier */
    sessionId: string;

    /** Runtime options for this execution */
    runOptions: Record<string, any>;

    /** Model provider being used */
    provider?: string;

    /** Model identifier being used */
    model?: string;
  }

  /**
   * Agent run end event - marks the completion of an agent execution session
   */
  export interface AgentRunEndEvent extends BaseEvent {
    type: 'agent_run_end';

    /** Unique session identifier */
    sessionId: string;

    /** Number of iterations executed */
    iterations: number;

    /** Total execution time */
    elapsedMs: number;

    /** Final execution status */
    status: string;
  }

  /**
   * Environment input event - for injecting contextual information
   *
   * This allows agents to receive multimodal context from their environment
   * without attributing it to a user message
   */
  export interface EnvironmentInputEvent extends BaseEvent {
    type: 'environment_input';

    /** The environment content (can be multimodal) */
    content: string | ChatCompletionContentPart[];

    /** Optional description of the environment input */
    description?: string;
  }

  /**
   * Represents a single step in a plan
   */
  export interface PlanStep {
    /** Description of what needs to be done */
    content: string;

    /** Whether this step has been completed */
    done: boolean;
  }

  /**
   * Plan start event - signals the beginning of a planning session
   */
  export interface PlanStartEvent extends BaseEvent {
    type: 'plan_start';

    /** Session identifier for this planning session */
    sessionId: string;
  }

  /**
   * Plan update event - contains the current state of the plan
   */
  export interface PlanUpdateEvent extends BaseEvent {
    type: 'plan_update';

    /** Session identifier for this planning session */
    sessionId: string;

    /** Current plan steps with their completion status */
    steps: PlanStep[];
  }

  /**
   * Plan finish event - signals the completion of the plan
   */
  export interface PlanFinishEvent extends BaseEvent {
    type: 'plan_finish';

    /** Session identifier for this planning session */
    sessionId: string;

    /** Summary of the completed plan */
    summary: string;
  }

  /**
   * Final answer event - contains a structured final response
   */
  export interface FinalAnswerEvent extends BaseEvent {
    type: 'final_answer';

    /** The final answer content */
    content: string;

    /** Whether this is from a deep research process */
    isDeepResearch: boolean;

    /** Optional title for the answer */
    title?: string;

    /** Format of the answer (e.g., 'markdown', 'json') */
    format?: string;

    /**
     * Unique message identifier that links streaming messages to their final message
     * This allows clients to correlate incremental updates with complete messages
     */
    messageId?: string;
  }

  /**
   * Final answer streaming event - for real-time final answer updates
   */
  export interface FinalAnswerStreamingEvent extends BaseEvent {
    type: 'final_answer_streaming';

    /** Incremental content chunk */
    content: string;

    /** Whether this is from a deep research process */
    isDeepResearch: boolean;

    /** Whether this is the final chunk */
    isComplete?: boolean;

    /**
     * Unique message identifier that links streaming messages to their final message
     * This allows clients to correlate incremental updates with complete messages
     */
    messageId?: string;
  }

  /**
   * Union of all event types in the Agent event stream
   */
  export type Event =
    | UserMessageEvent
    | AssistantMessageEvent
    | AssistantThinkingMessageEvent
    | ToolCallEvent
    | ToolResultEvent
    | SystemEvent
    | AssistantStreamingMessageEvent
    | AssistantStreamingThinkingMessageEvent
    | AgentRunStartEvent
    | AgentRunEndEvent
    | EnvironmentInputEvent
    | PlanStartEvent
    | PlanUpdateEvent
    | PlanFinishEvent
    | FinalAnswerEvent
    | FinalAnswerStreamingEvent;

  /**
   * Event payload type - provides type safety for event creation
   */
  export type EventPayload<T extends EventType> = Extract<Event, { type: T }>;
}

/**
 * Event stream options for configuring the event stream behavior
 */
export interface AgentEventStreamOptions {
  /** Maximum number of events to keep in memory */
  maxEvents?: number;

  /** Whether to automatically trim old events */
  autoTrim?: boolean;
}

/**
 * Event stream interface for manager agent events
 */
export interface IAgentEventStreamManager {
  /**
   * Create a new event with the specified type and data
   */
  createEvent<T extends AgentEventStream.EventType>(
    type: T,
    data: Omit<AgentEventStream.EventPayload<T>, keyof AgentEventStream.BaseEvent>,
  ): AgentEventStream.EventPayload<T>;

  /**
   * Send an event to the stream
   */
  sendEvent(event: AgentEventStream.Event): void;

  /**
   * Get events from the stream with optional filtering
   */
  getEvents(filter?: AgentEventStream.EventType[], limit?: number): AgentEventStream.Event[];

  /**
   * Get events by specific types
   */
  getEventsByType(types: AgentEventStream.EventType[], limit?: number): AgentEventStream.Event[];

  /**
   * Clear all events from the stream
   */
  clear(): void;

  /**
   * Subscribe to new events
   */
  subscribe(callback: (event: AgentEventStream.Event) => void): () => void;

  /**
   * Subscribe to specific event types
   */
  subscribeToTypes(
    types: AgentEventStream.EventType[],
    callback: (event: AgentEventStream.Event) => void,
  ): () => void;

  /**
   * Subscribe to streaming events only
   */
  subscribeToStreamingEvents(
    callback: (
      event:
        | AgentEventStream.AssistantStreamingMessageEvent
        | AgentEventStream.AssistantStreamingThinkingMessageEvent,
    ) => void,
  ): () => void;

  /**
   * Get the latest assistant response
   */
  getLatestAssistantResponse(): AgentSingleLoopReponse | null;

  /**
   * Get tool call results since the last assistant message
   */
  getLatestToolResults(): { toolCallId: string; toolName: string; content: any }[];
}
