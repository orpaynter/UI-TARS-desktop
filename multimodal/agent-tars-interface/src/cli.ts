/**
 * Command line interface arguments definition
 * Used to capture and parse CLI input parameters
 *
 * This interface maps CLI arguments to their corresponding configuration paths
 * using dot notation for nested properties (e.g., --model.id maps to model.id in config)
 */
export interface AgentTARSCLIArguments {
  // Server configuration
  /** Server port number */
  port?: number;

  /** Configuration file paths or URLs */
  config?: string[];

  // Logging configuration
  /** Log level setting (debug, info, warn, error) */
  logLevel?: string;
  /** Enable debug mode (highest priority, shows tool calls and system events) */
  debug?: boolean;
  /** Reduce startup logging to minimum */
  quiet?: boolean;

  // Model configuration (model.*)
  /** LLM provider name - maps to model.provider */
  'model.provider'?: string;
  /** Model identifier - maps to model.id */
  'model.id'?: string;
  /** API key for the model provider - maps to model.apiKey */
  'model.apiKey'?: string;
  /** Base URL for the model provider - maps to model.baseURL */
  'model.baseURL'?: string;

  // LLM behavior configuration
  /** Enable streaming mode for LLM responses */
  stream?: boolean;
  /** Enable reasoning mode for compatible models - maps to thinking.type */
  'thinking.type'?: string;

  // Tool call engine configuration
  /** Tool call engine type - maps to toolCallEngine */
  toolCallEngine?: string;

  // Workspace configuration (workspace.*)
  /** Working directory path - maps to workspace.workingDirectory */
  'workspace.workingDirectory'?: string;

  // Browser configuration (browser.*)
  /** Browser control mode - maps to browser.control */
  'browser.control'?: string;

  // Planner configuration (planner.*)
  /** Enable planning functionality - maps to planner.enabled */
  'planner.enabled'?: boolean;

  // Share configuration (share.*)
  /** Share provider URL - maps to share.provider */
  'share.provider'?: string;

  // AGIO configuration (agio.*)
  /** AGIO monitoring provider URL - maps to agio.provider */
  'agio.provider'?: string;

  // Snapshot configuration (snapshot.*)
  /** Enable agent snapshot functionality - maps to snapshot.enable */
  'snapshot.enable'?: boolean;
  /** Path for storing agent snapshots - maps to snapshot.snapshotPath */
  'snapshot.snapshotPath'?: string;

  // Allow additional properties for extensibility
  [key: string]: any;
}
