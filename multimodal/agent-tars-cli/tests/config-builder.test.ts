/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigBuilder } from '../src/config/builder';
import { AgentTARSCLIArguments, AgentTARSAppConfig, LogLevel } from '@agent-tars/interface';

/**
 * Test suite for the ConfigBuilder class
 *
 * These tests verify:
 * 1. CLI arguments are properly mapped to configuration objects
 * 2. Dot notation CLI arguments work correctly (e.g., --model.id)
 * 3. Environment variable resolution works
 * 4. Configuration merging prioritizes CLI over user config
 * 5. All configuration sections are handled correctly
 */
describe('ConfigBuilder', () => {
  let mockResolveValue: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock resolveValue function
    mockResolveValue = vi.fn((value: string) => value);
    vi.doMock('../src/utils', () => ({
      resolveValue: mockResolveValue,
    }));
  });

  describe('buildAppConfig', () => {
    it('should merge CLI arguments with user config', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'model.provider': 'openai',
        'model.id': 'gpt-4',
        port: 3000,
      };

      const userConfig: AgentTARSAppConfig = {
        model: {
          provider: 'anthropic',
          id: 'claude-3',
          apiKey: 'user-key',
        },
        search: {
          provider: 'browser_search',
        },
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, userConfig);

      expect(result).toEqual({
        model: {
          provider: 'openai', // CLI overrides user config
          id: 'gpt-4', // CLI overrides user config
          apiKey: 'user-key', // Preserved from user config
        },
        search: {
          provider: 'browser_search', // Preserved from user config
        },
        server: {
          port: 3000, // Applied from CLI
        },
      });
    });

    it('should handle model configuration with dot notation', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'model.provider': 'openai',
        'model.id': 'gpt-4',
        'model.apiKey': 'test-key',
        'model.baseURL': 'https://api.test.com',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.model).toEqual({
        provider: 'openai',
        id: 'gpt-4',
        apiKey: 'test-key',
        baseURL: 'https://api.test.com',
      });
    });

    it('should handle workspace configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'workspace.workingDirectory': '/custom/workspace',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.workspace).toEqual({
        workingDirectory: '/custom/workspace',
      });
    });

    it('should handle browser configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'browser.control': 'browser-use-only',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.browser).toEqual({
        control: 'browser-use-only',
      });
    });

    it('should handle planner configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'planner.enabled': true,
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.planner).toEqual({
        enabled: true,
      });
    });

    it('should handle thinking configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'thinking.type': 'enabled',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.thinking).toEqual({
        type: 'enabled',
      });
    });

    it('should handle tool call engine configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        toolCallEngine: 'prompt_engineering',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.toolCallEngine).toBe('prompt_engineering');
    });

    it('should handle share configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'share.provider': 'https://share.example.com',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.share).toEqual({
        provider: 'https://share.example.com',
      });
    });

    it('should handle AGIO configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'agio.provider': 'https://agio.example.com',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.agio).toEqual({
        provider: 'https://agio.example.com',
      });
    });

    it('should handle snapshot configuration', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'snapshot.enable': true,
        'snapshot.snapshotPath': '/custom/snapshots',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.snapshot).toEqual({
        enable: true,
        snapshotPath: '/custom/snapshots',
      });
    });

    it('should handle logging configuration with debug priority', () => {
      const cliArgs: AgentTARSCLIArguments = {
        logLevel: 'info',
        debug: true, // Should override logLevel
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});
      expect(result.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should handle quiet mode', () => {
      const cliArgs: AgentTARSCLIArguments = {
        quiet: true,
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.logLevel).toBe(LogLevel.SILENT);
    });

    it('should preserve existing nested configuration when adding new values', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'model.provider': 'openai',
      };

      const userConfig: AgentTARSAppConfig = {
        model: {
          id: 'existing-model',
          apiKey: 'existing-key',
        },
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, userConfig);

      expect(result.model).toEqual({
        provider: 'openai', // Added from CLI
        id: 'existing-model', // Preserved from user config
        apiKey: 'existing-key', // Preserved from user config
      });
    });

    it('should handle server configuration with default port', () => {
      const cliArgs: AgentTARSCLIArguments = {};
      const userConfig: AgentTARSAppConfig = {};

      const result = ConfigBuilder.buildAppConfig(cliArgs, userConfig);

      expect(result.server).toEqual({
        port: 8888, // Default port
      });
    });

    it('should override server port when specified in CLI', () => {
      const cliArgs: AgentTARSCLIArguments = {
        port: 3000,
      };

      const userConfig: AgentTARSAppConfig = {
        server: {
          port: 8888,
        },
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, userConfig);

      expect(result.server).toEqual({
        port: 3000, // CLI overrides user config
      });
    });

    it('should handle invalid log level gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const cliArgs: AgentTARSCLIArguments = {
        logLevel: 'invalid-level',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown log level: invalid-level, using default log level',
      );
      expect(result.logLevel).toBeUndefined();

      consoleWarnSpy.mockRestore();
    });

    it('should only create snapshot config when snapshot options are provided', () => {
      const cliArgs: AgentTARSCLIArguments = {
        'model.provider': 'openai',
      };

      const result = ConfigBuilder.buildAppConfig(cliArgs, {});

      expect(result.snapshot).toBeUndefined();
    });
  });
});
