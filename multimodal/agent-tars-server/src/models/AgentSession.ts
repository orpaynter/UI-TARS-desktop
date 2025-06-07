import { AgentTARS, EventType, Event, AgentTARSOptions, AgentStatus } from '@agent-tars/core';
import { AgentSnapshot } from '@multimodal/agent-snapshot';
import { EventStreamBridge } from '../event-stream';
import { StorageProvider } from '../storage';

import { AgioProvider } from '../agio/agio-provider';
import path from 'path';
import { ServerSnapshotOptions } from './ServerOptions';

/**
 * AgentSession - Represents a single agent execution context
 *
 * Responsible for:
 * - Managing an AgentTARS instance and its lifecycle
 * - Connecting agent events to clients via EventStreamBridge
 * - Handling queries and interactions with the agent
 * - Persisting events to storage
 * - Collecting AGIO monitoring events if configured
 */

export class AgentSession {
  id: string;
  agent: AgentTARS;
  eventBridge: EventStreamBridge;
  private unsubscribe: (() => void) | null = null;
  private isDebug: boolean;
  private storageProvider: StorageProvider | null = null;
  private agioProvider?: AgioProvider;

  constructor(
    sessionId: string,
    workingDirectory: string,
    config: AgentTARSOptions = {},
    isDebug = false,
    storageProvider: StorageProvider | null = null,
    snapshotOptions?: ServerSnapshotOptions,
    agioProviderUrl?: string,
  ) {
    this.id = sessionId;
    this.eventBridge = new EventStreamBridge();
    this.isDebug = isDebug;
    this.storageProvider = storageProvider;

    // Initialize agent with merged config
    const agent = new AgentTARS({
      ...config,
      workspace: {
        ...(config.workspace || {}),
        workingDirectory,
      },
    });

    // Initialize agent snapshot if enabled
    if (snapshotOptions?.enable) {
      const snapshotPath = snapshotOptions.snapshotPath || path.join(workingDirectory, 'snapshots');
      this.agent = new AgentSnapshot(agent, {
        snapshotPath,
        snapshotName: sessionId,
      }) as unknown as AgentTARS;

      if (this.isDebug) {
        console.log(`AgentSnapshot initialized with path: ${snapshotPath}`);
      }
    } else {
      this.agent = agent;
    }

    // Initialize AGIO collector if provider URL is configured
    if (agioProviderUrl) {
      this.agioProvider = new AgioProvider(agioProviderUrl, sessionId, agent.getOptions());
      if (this.isDebug) {
        console.log(`AGIO collector initialized with provider: ${agioProviderUrl}`);
      }
    }
  }

  /**
   * Get the current processing status of the agent
   * @returns Whether the agent is currently processing a request
   */
  getProcessingStatus(): boolean {
    return this.agent.status() === AgentStatus.EXECUTING;
  }

  async initialize() {
    await this.agent.initialize();

    // Send agent initialization event to AGIO if configured
    if (this.agioProvider) {
      try {
        await this.agioProvider.sendAgentInitialized();
      } catch (error) {
        console.error('Failed to send AGIO initialization event:', error);
      }
    }

    // Connect to agent's event stream manager
    const agentEventStream = this.agent.getEventStream();

    // Create an event handler that saves events to storage and processes AGIO events
    const handleEvent = async (event: Event) => {
      // If we have storage, save the event
      if (this.storageProvider) {
        try {
          await this.storageProvider.saveEvent(this.id, event);
        } catch (error) {
          console.error(`Failed to save event to storage: ${error}`);
        }
      }

      // Process AGIO events if collector is configured
      if (this.agioProvider) {
        try {
          await this.agioProvider.processAgentEvent(event);
        } catch (error) {
          console.error('Failed to process AGIO event:', error);
        }
      }
    };

    // Subscribe to events for storage and AGIO processing
    const storageUnsubscribe = agentEventStream.subscribe(handleEvent);

    // Connect to event bridge for client communication
    this.unsubscribe = this.eventBridge.connectToAgentEventStream(agentEventStream);

    // Notify client that session is ready
    this.eventBridge.emit('ready', { sessionId: this.id });

    return { storageUnsubscribe };
  }

  async runQuery(query: string) {
    try {
      // Run agent to process the query
      const answer = await this.agent.run(query);
      return answer;
    } catch (error) {
      this.eventBridge.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async runQueryStreaming(query: string): Promise<AsyncIterable<Event>> {
    try {
      // Run agent in streaming mode
      return await this.agent.run({
        input: query,
        stream: true,
      });
    } catch (error) {
      this.eventBridge.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Abort the currently running query
   * @returns True if the agent was running and aborted successfully
   */
  async abortQuery(): Promise<boolean> {
    try {
      const aborted = this.agent.abort();
      if (aborted) {
        this.eventBridge.emit('aborted', { sessionId: this.id });
      }
      return aborted;
    } catch (error) {
      this.eventBridge.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async cleanup() {
    // Unsubscribe from event stream
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Clean up agent resources
    await this.agent.cleanup();
    this.eventBridge.emit('closed', { sessionId: this.id });
  }
}

export default AgentSession;
