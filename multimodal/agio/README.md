# @multimodal/agio

## Overview

**Agio** (**Ag**ent **I**nsights and **O**bservations) is a standardized multimodal AI Agent Server monitoring protocol for server-side agent operation monitoring and analytics. It provides a consistent event schema for tracking agent behavior, performance metrics, and usage patterns.

It's designed for [@multimodal/agent](https://www.npmjs.com/@multimodal/agent) and all of agents built on `@multimodal/agent`, such as [@mcp-agent/core](https://www.npmjs.com/package/@mcp-agent/core), [@agent-tars/core](https://www.npmjs.com/@agent-tars/core) etc.

## Motivation

The goal of this protocol is to provide standardized server-side monitoring for Agent operations, allowing service providers to focus on implementing monitoring infrastructure rather than designing data schemas.

While Agio shares some conceptual similarities with the `Agent Event Stream` in [@multimodal/agent](https://www.npmjs.com/@multimodal/agent), they serve distinct purposes:

| Feature | Agent Event Stream | Agio |
| --- | --- | --- |
| **Primary Purpose** | Internal framework mechanism for memory construction and UI rendering | Server-side monitoring protocol for operational insights |
| **Target Audience** | Agent Framework developers | Operations teams and service providers |
| **Data Focus** | Detailed interaction events for agent functionality | High-level metrics for performance and operational health |
| **Application** | Building agent memory, rendering UI components | Analytics dashboards, service monitoring, capacity planning |

> [!WARNING]  
> The goal of this protocol does not involve the collection of any user data. Please implement it in the upper-level server system.

## Key Features

- **Standardized Schema**: Consistent event format for all agent operations
- **Operational Focus**: Tracks metrics like TTFT, TPS, execution times, and resource usage
- **Extensible Design**: Easily implementable in any monitoring or analytics system
- **Type Safety**: Full TypeScript support with type-safe event creation and handling
- **Custom Events**: Support for extending with domain-specific monitoring events

## Installation

```bash
npm install @multimodal/agio
```

## Usage

### JSON Schema

You can access the AGIO Schema at [agio-schema.json](https://github.com/bytedance/UI-TARS-desktop/tree/main/multimodal/agio/agio-schema.json)

### Basic Usage

```typescript
import { AgioEvent } from '@multimodal/agio';

// Create a typed event
const initEvent: AgioEvent.AgentInitializedEvent = {
  type: 'agent_initialized',
  timestamp: Date.now(),
  sessionId: 'session-123',
  config: {
    modelProvider: 'openai',
    modelName: 'gpt-4',
    browserControl: 'headless',
  },
  system: {
    platform: process.platform,
    osVersion: process.version,
    nodeVersion: process.version,
  },
};

// Send to your monitoring system
yourMonitoringSystem.track(initEvent);
```

### Implementing an Agio Provider

```typescript
import { AgioEvent, AgentEventStream } from '@multimodal/agio';

class MyAgioProvider implements AgioEvent.AgioProvider {
  async sendAgentInitialized(): Promise<void> {
    // Implementation for sending initialization events
  }

  async processAgentEvent(event: AgentEventStream.Event): Promise<void> {
    // Convert agent events to Agio events and send to monitoring system
    switch (event.type) {
      case 'agent_run_start':
        // Process and transform event
        break;
      // Handle other event types...
    }
  }
}
```

### Type-Safe Event Creation

```typescript
import { AgioEvent } from '@multimodal/agio';

// Type-safe event payload creation
function createEvent<T extends AgioEvent.EventType>(
  type: T,
  sessionId: string,
  payload: Omit<AgioEvent.EventPayload<T>, 'type' | 'timestamp' | 'sessionId'>
): AgioEvent.EventPayload<T> {
  return {
    type,
    timestamp: Date.now(),
    sessionId,
    ...payload,
  } as AgioEvent.EventPayload<T>;
}

// Usage
const ttftEvent = createEvent('agent_ttft', 'session-123', {
  ttftMs: 150,
});
```

## Extending Agio

Agio supports extension with custom event types for domain-specific monitoring needs. This allows you to add your own events while maintaining type safety and consistency with the core protocol.

### Adding Custom Events

```typescript
// 1. Define your custom event interfaces
interface CustomAgioEvents {
  'custom_performance_metric': {
    type: 'custom_performance_metric';
    metricName: string;
    value: number;
    unit: string;
    category: 'latency' | 'throughput' | 'quality';
  };
  
  'business_event': {
    type: 'business_event';
    eventName: string;
    properties: Record<string, any>;
    userId?: string;
  };
}

// 2. Extend the Agio namespace
declare module '@multimodal/agio' {
  namespace AgioEvent {
    interface Extensions extends CustomAgioEvents {}
  }
}

// 3. Use your custom events with full type safety
const customEvent: AgioEvent.ExtendedEvent = {
  type: 'custom_performance_metric',
  timestamp: Date.now(),
  sessionId: 'session-123',
  metricName: 'response_quality',
  value: 0.95,
  unit: 'score',
  category: 'quality'
};

// 4. Type-safe event filtering
function isCustomEvent(event: AgioEvent.ExtendedEvent): event is AgioEvent.ExtendedEventPayload<'custom_performance_metric'> {
  return event.type === 'custom_performance_metric';
}
```

### Best Practices for Extensions

1. **Namespace your events**: Use descriptive prefixes to avoid conflicts
   ```typescript
   interface MyLibraryEvents {
     'mylib_custom_metric': { /* ... */ };
     'mylib_business_event': { /* ... */ };
   }
   ```

2. **Follow the base event structure**: Always extend from the base event pattern
   ```typescript
   interface MyCustomEvent {
     type: 'my_custom_event';
     // Always include these via BaseEvent
     // timestamp: number;
     // sessionId: string;
     // runId?: string;
     
     // Your custom fields
     customField: string;
   }
   ```

3. **Document your extensions**: Provide clear documentation for custom events
   ```typescript
   interface DocumentedEvents {
     /**
      * Custom metric for tracking user engagement
      * Sent when user interacts with specific features
      */
     'engagement_metric': {
       type: 'engagement_metric';
       featureName: string;
       engagementScore: number;
       interactionType: 'click' | 'scroll' | 'hover';
     };
   }
   ```

## Events Reference

Agio provides standardized events for:

### Agent Lifecycle Events
- `agent_initialized` - Agent session creation with configuration details
- `agent_run_start` - Task initiation with user input
- `agent_run_end` - Task completion with execution metrics
- `agent_cleanup` - Session cleanup and resource deallocation

### Performance Metrics
- `agent_ttft` - Time To First Token (critical UX metric)
- `agent_tps` - Tokens Per Second (throughput monitoring)

### Execution Tracking
- `agent_loop_start` - Agent iteration beginning
- `agent_loop_end` - Agent iteration completion with metrics
- `tool_call` - Tool invocation tracking
- `tool_result` - Tool execution results and performance

### Quality Metrics
- `user_feedback` - User satisfaction and task completion feedback

Each event includes consistent metadata like timestamps and session identifiers, along with event-specific data relevant for operational monitoring.

## Schema Validation

The complete JSON schema is available for validation and integration with monitoring systems. Use it to:

- Validate events before sending to analytics systems
- Generate documentation for your monitoring infrastructure
- Ensure compliance with the Agio standard in your implementations

## Integration Examples

### With Analytics Systems

```typescript
// Example integration with analytics platform
class AnalyticsAgioProvider implements AgioEvent.AgioProvider {
  constructor(private analytics: AnalyticsClient) {}

  async sendAgentInitialized(): Promise<void> {
    const event: AgioEvent.AgentInitializedEvent = {
      type: 'agent_initialized',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      config: this.getAgentConfig(),
      system: this.getSystemInfo(),
    };
    
    await this.analytics.track('agio_event', event);
  }

  async processAgentEvent(event: AgentEventStream.Event): Promise<void> {
    // Transform and forward to analytics
    const agioEvent = this.transformEvent(event);
    await this.analytics.track('agio_event', agioEvent);
  }
}
```

### With Custom Monitoring

```typescript
// Example custom monitoring implementation
class CustomMonitoringProvider implements AgioEvent.AgioProvider {
  async sendAgentInitialized(): Promise<void> {
    // Send to custom monitoring endpoint
    await fetch('/api/monitoring/agio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  }

  async processAgentEvent(event: AgentEventStream.Event): Promise<void> {
    // Custom processing logic
  }
}
```

## Contributing

Contributions are welcome! Please ensure that any new core event types:

1. Follow the established patterns and naming conventions
2. Include comprehensive documentation
3. Provide clear use cases for operational monitoring
4. Maintain backward compatibility

For custom events, consider whether they should be part of the core protocol or implemented as extensions in your own packages.

## License

Apache-2.0 - see the [LICENSE](LICENSE) file for details.
