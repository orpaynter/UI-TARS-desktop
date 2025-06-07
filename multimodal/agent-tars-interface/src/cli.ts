/**
 * Command line interface arguments definition
 * Used to capture and parse CLI input parameters
 */
export interface AgentTARSCLIArguments {
  port?: number;
  config?: string[];
  logLevel?: string;
  debug?: boolean;
  quiet?: boolean;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  stream?: boolean;
  thinking?: boolean;
  pe?: boolean;
  workspace?: string;
  browserControl?: string;
  planner?: boolean;
  shareProvider?: string;
  agioProvider?: string;
  enableSnapshot?: boolean;
  snapshotPath?: string;
  [key: string]: any; // Allow additional properties
}
