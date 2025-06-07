/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Command } from 'cac';
import { AgentTARSCLIArguments, AgentTARSAppConfig } from '@agent-tars/interface';
import { logger } from '../utils';
import { loadTarsConfig } from '../config/loader';
import { ConfigBuilder } from '../config/builder';

export { AgentTARSCLIArguments };

export const DEFAULT_PORT = 8888;

/**
 * Add common options to a command
 * Centralizes option definitions to ensure consistency across commands
 */
export function addCommonOptions(command: Command): Command {
  return (
    command
      .option('--port <port>', 'Port to run the server on', { default: DEFAULT_PORT })

      .option(
        '--config, -c <path>',
        `Path to configuration file(s) or URL(s)
      
                            Specify one or more configuration files or URLs. Multiple values are merged sequentially,
                            with later files overriding earlier ones. Supports local paths or remote URLs.
                            
                            Examples:
                              --config ./my-config.json
                              --config https://example.com/config.json
                              --config ./base-config.yml --config ./override.json
                            
                            Supported file formats: .ts, .js, .json, .yml, .yaml
                            
                            If not specified, looks for agent-tars.config.{ts,js,json,yml,yaml} in current directory.
      `,
        {
          type: [String],
        },
      )
      .option('--log-level <level>', 'Log level (debug, info, warn, error)')
      .option('--debug', 'Enable debug mode (show tool calls and system events), highest priority')
      .option('--quiet', 'Reduce startup logging to minimum')

      // Model configuration (using dot notation)
      .option('--model.provider [provider]', 'LLM provider name (replaces deprecated --provider)')
      .option('--model.id [model]', 'Model identifier (replaces deprecated --model)')
      .option('--model.apiKey [apiKey]', 'Custom API key')
      .option('--model.baseURL [baseURL]', 'Custom base URL')

      // LLM behavior
      .option('--stream', 'Enable streaming mode for LLM responses')
      .option('--thinking.type [type]', 'Enable reasoning mode for compatible models (enabled)')

      // Tool call engine (replaces deprecated --pe)
      .option(
        '--toolCallEngine [engine]',
        'Tool call engine type (native, prompt_engineering, structured_outputs)',
      )

      // Workspace configuration
      .option('--workspace.workingDirectory <path>', 'Path to workspace directory')

      // Browser configuration
      .option(
        '--browser.control [mode]',
        'Browser control mode (mixed, browser-use-only, gui-agent-only)',
      )

      // Planner configuration
      .option('--planner.enabled', 'Enable planning functionality for complex tasks')

      // Share configuration
      .option('--share.provider [url]', 'Share provider URL')

      // Snapshot configuration (using dot notation)
      .option(
        '--snapshot.enable',
        'Enable agent snapshot functionality (replaces deprecated --enableSnapshot)',
      )
      .option('--snapshot.snapshotPath <path>', 'Path for storing agent snapshots')

      // AGIO configuration
      .option(
        '--agio.provider <url>',
        `AGIO monitoring provider URL for agent analytics
      
                            When specified, the agent will send standardized monitoring events to the configured
                            endpoint for insights and observability. This includes metrics like execution time,
                            tool usage, loop iterations, and error rates.
                            
                            PRIVACY NOTICE: This cli does not connect to any external server by default.
                            Event transmission only occurs when you explicitly configure this option with a provider URL.
                            
                            Examples:
                              --agio.provider http://localhost:3000/events
                              --agio.provider https://analytics.example.com/api/events
                            
                            For more information about AGIO events and data collection, see the documentation.
      `,
      )
  );
}

/**
 * Process common command options and prepare configuration
 * Handles option parsing, config loading, and merging for reuse across commands
 */
export async function processCommonOptions(options: AgentTARSCLIArguments): Promise<{
  appConfig: AgentTARSAppConfig;
  isDebug: boolean;
}> {
  const { config: configPath, debug } = options;

  // Set debug mode flag
  const isDebug = !!debug;

  // Load user config from file
  const userConfig = await loadTarsConfig(configPath, isDebug);

  // Build complete application configuration
  const appConfig = ConfigBuilder.buildAppConfig(options, userConfig);

  // Set logger level if specified
  if (appConfig.logLevel) {
    logger.setLevel(appConfig.logLevel);
  }

  logger.debug('Application configuration built from CLI and config files');

  return { appConfig, isDebug };
}
