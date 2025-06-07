/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AgentTARSCLIArguments,
  AgentTARSAppConfig,
  LogLevel,
  BrowserControlMode,
  ModelProviderName,
} from '@agent-tars/interface';
import { resolveValue } from '../utils';

/**
 * ConfigBuilder - Transforms CLI arguments into application configuration
 *
 * This class is responsible for converting command line arguments and user configuration
 * into a complete AgentTARSAppConfig object that can be passed to the server.
 *
 * Key responsibilities:
 * - Merge CLI arguments with loaded configuration
 * - Apply defaults where necessary
 * - Resolve environment variables
 * - Transform CLI-specific options into proper config structure
 * - Support dot notation CLI arguments (e.g., --model.id -> config.model.id)
 */
export class ConfigBuilder {
  /**
   * Build complete application configuration from CLI arguments and user config
   *
   * @param cliArgs Command line arguments parsed from CLI
   * @param userConfig User configuration loaded from files
   * @returns Complete application configuration ready for server
   */
  static buildAppConfig(
    cliArgs: AgentTARSCLIArguments,
    userConfig: AgentTARSAppConfig,
  ): AgentTARSAppConfig {
    // Start with user config as base
    const config: AgentTARSAppConfig = this.deepMerge({}, userConfig);

    // Apply CLI overrides
    this.applyLoggingConfig(config, cliArgs);
    this.applyModelConfig(config, cliArgs);
    this.applyWorkspaceConfig(config, cliArgs);
    this.applyBrowserConfig(config, cliArgs);
    this.applyPlannerConfig(config, cliArgs);
    this.applyThinkingConfig(config, cliArgs);
    this.applyToolCallEngineConfig(config, cliArgs);
    this.applyServerConfig(config, cliArgs);
    this.applyShareConfig(config, cliArgs);
    this.applyAgioConfig(config, cliArgs);
    this.applySnapshotConfig(config, cliArgs);

    return config;
  }

  /**
   * Apply logging configuration from CLI arguments
   */
  private static applyLoggingConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs.logLevel) {
      config.logLevel = this.parseLogLevel(cliArgs.logLevel);
    }

    if (cliArgs.quiet) {
      config.logLevel = LogLevel.SILENT;
    }

    if (cliArgs.debug) {
      config.logLevel = LogLevel.DEBUG;
    }
  }

  /**
   * Apply model configuration from CLI arguments
   */
  private static applyModelConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (
      cliArgs['model.provider'] ||
      cliArgs['model.id'] ||
      cliArgs['model.apiKey'] ||
      cliArgs['model.baseURL']
    ) {
      if (!config.model) {
        config.model = {};
      }

      if (cliArgs['model.provider']) {
        config.model.provider = cliArgs['model.provider'] as ModelProviderName;
      }

      if (cliArgs['model.id']) {
        config.model.id = cliArgs['model.id'];
      }

      if (cliArgs['model.apiKey']) {
        config.model.apiKey = resolveValue(cliArgs['model.apiKey'], 'API key');
      }

      if (cliArgs['model.baseURL']) {
        config.model.baseURL = resolveValue(cliArgs['model.baseURL'], 'base URL');
      }
    }
  }

  /**
   * Apply workspace configuration from CLI arguments
   */
  private static applyWorkspaceConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['workspace.workingDirectory']) {
      if (!config.workspace) {
        config.workspace = {};
      }
      config.workspace.workingDirectory = cliArgs['workspace.workingDirectory'];
    }
  }

  /**
   * Apply browser configuration from CLI arguments
   */
  private static applyBrowserConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['browser.control'] && typeof cliArgs['browser.control'] === 'string') {
      if (!config.browser) {
        config.browser = {};
      }
      config.browser.control = cliArgs['browser.control'] as BrowserControlMode;
    }
  }

  /**
   * Apply planner configuration from CLI arguments
   */
  private static applyPlannerConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['planner.enabled'] === true) {
      config.planner = { enabled: true };
    }
  }

  /**
   * Apply thinking configuration from CLI arguments
   */
  private static applyThinkingConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['thinking.type']) {
      config.thinking = {
        type: cliArgs['thinking.type'] as 'enabled',
      };
    }
  }

  /**
   * Apply tool call engine configuration from CLI arguments
   */
  private static applyToolCallEngineConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs.toolCallEngine) {
      config.toolCallEngine = cliArgs.toolCallEngine as
        | 'native'
        | 'prompt_engineering'
        | 'structured_outputs';
    }
  }

  /**
   * Apply server configuration from CLI arguments
   */
  private static applyServerConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (!config.server) {
      config.server = {
        port: 8888,
      };
    }

    if (cliArgs.port) {
      config.server.port = cliArgs.port;
    }
  }

  /**
   * Apply share configuration from CLI arguments
   */
  private static applyShareConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['share.provider']) {
      if (!config.share) {
        config.share = {};
      }
      config.share.provider = cliArgs['share.provider'];
    }
  }

  /**
   * Apply AGIO configuration from CLI arguments
   */
  private static applyAgioConfig(config: AgentTARSAppConfig, cliArgs: AgentTARSCLIArguments): void {
    if (cliArgs['agio.provider']) {
      if (!config.agio) {
        config.agio = {};
      }
      config.agio.provider = cliArgs['agio.provider'];
    }
  }

  /**
   * Apply snapshot configuration from CLI arguments
   */
  private static applySnapshotConfig(
    config: AgentTARSAppConfig,
    cliArgs: AgentTARSCLIArguments,
  ): void {
    if (cliArgs['snapshot.enable'] || cliArgs['snapshot.snapshotPath']) {
      if (!config.snapshot) {
        config.snapshot = {
          enable: false,
          snapshotPath: '',
        };
      }

      if (cliArgs['snapshot.enable']) {
        config.snapshot.enable = true;
      }

      if (cliArgs['snapshot.snapshotPath']) {
        config.snapshot.snapshotPath = cliArgs['snapshot.snapshotPath'];
      }
    }
  }

  /**
   * Parse log level string to enum
   */
  private static parseLogLevel(level: string): LogLevel | undefined {
    const upperLevel = level.toUpperCase();
    if (upperLevel === 'DEBUG') return LogLevel.DEBUG;
    if (upperLevel === 'INFO') return LogLevel.INFO;
    if (upperLevel === 'WARN' || upperLevel === 'WARNING') return LogLevel.WARN;
    if (upperLevel === 'ERROR') return LogLevel.ERROR;

    console.warn(`Unknown log level: ${level}, using default log level`);
    return undefined;
  }

  /**
   * Deep merge two objects with the second taking precedence
   */
  private static deepMerge(
    target: Record<string, any>,
    source: Record<string, any>,
  ): Record<string, any> {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * Check if value is an object (not an array or null)
   */
  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}
