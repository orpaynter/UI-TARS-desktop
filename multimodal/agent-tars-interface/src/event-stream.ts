/* eslint-disable @typescript-eslint/no-namespace */
import { AgentEventStream } from '@multimodal/agent-interface';

// Define custom event interface
interface MyCustomEventInterface extends AgentEventStream.BaseEvent {
  type: 'browser_state';
  url: string;
  screenshot?: string;
}

// Extend the event mapping through module augmentation
declare module '@multimodal/agent-interface' {
  namespace AgentEventStream {
    interface ExtendedEventMapping {
      browser_state: MyCustomEventInterface;
    }
  }
}
