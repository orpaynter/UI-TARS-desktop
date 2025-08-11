/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { deepMerge } from '@tarko/shared-utils';
import { loadConfig } from '@tarko/config-loader';
import { AgentAppConfig } from '@tarko/interface';
import fetch from 'node-fetch';
import { logger } from '../utils';
import { CONFIG_FILES } from './paths';

/**
 * Load remote configuration from URL
 *
 * @param url URL to the remote configuration
 * @param isDebug Whether to output debug information
 * @returns Loaded configuration object
 */
async function loadRemoteConfig(url: string, isDebug = false): Promise<AgentAppConfig> {
  try {
    logger.info(`Loading remote config from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch remote config: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    logger.debug(`Remote config content type: ${contentType}`);

    let config: AgentAppConfig;
    if (contentType.includes('application/json')) {
      config = await response.json();
    } else {
      logger.warn(`Remote config has non-JSON content type: ${contentType}`);
      const text = await response.text();
      try {
        config = JSON.parse(text);
      } catch (error) {
        throw new Error(
          `Failed to parse remote config as JSON: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    logger.success(`✓ Successfully loaded remote config from: ${url}`);
    if (isDebug) {
      logger.debug(`Remote config keys: [${Object.keys(config).join(', ')}]`);
    }

    return config;
  } catch (error) {
    logger.error(
      `✗ Failed to load remote config from ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {};
  }
}

/**
 * Check if a string is a valid URL
 */
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load configuration from files or URLs
 */
export async function loadAgentConfig(
  configPaths?: string[],
  isDebug = false,
): Promise<AgentAppConfig> {
  logger.info('🔧 Starting configuration loading process');

  // Handle no config case - try to load from default locations
  if (!configPaths || configPaths.length === 0) {
    logger.info('No config paths provided, searching for default config files');
    logger.debug(`Default config files: [${CONFIG_FILES.join(', ')}]`);

    try {
      const { content, filePath } = await loadConfig<AgentAppConfig>({
        cwd: process.cwd(),
        configFiles: CONFIG_FILES,
      });

      if (filePath) {
        logger.success(`✓ Loaded default config from: ${filePath}`);
        if (isDebug) {
          logger.debug(`Default config keys: [${Object.keys(content).join(', ')}]`);
        }
      }

      return content;
    } catch (err) {
      logger.warn(
        `No default configuration found: ${err instanceof Error ? err.message : String(err)}`,
      );
      logger.info('Using empty configuration as fallback');
      return {};
    }
  }

  logger.info(
    `Loading configuration from ${configPaths.length} source(s): [${configPaths.join(', ')}]`,
  );
  let mergedConfig: AgentAppConfig = {};
  const loadedSources: string[] = [];
  const failedSources: string[] = [];

  // Process each config path in order, merging sequentially
  for (const [index, path] of configPaths.entries()) {
    logger.debug(`[${index + 1}/${configPaths.length}] Processing config source: ${path}`);
    let config: AgentAppConfig = {};

    if (isUrl(path)) {
      // Load from URL
      config = await loadRemoteConfig(path, isDebug);
      if (Object.keys(config).length > 0) {
        loadedSources.push(`${path} (remote)`);
      } else {
        failedSources.push(`${path} (remote)`);
      }
    } else {
      // Load from file
      try {
        const { content, filePath } = await loadConfig<AgentAppConfig>({
          cwd: process.cwd(),
          path,
        });

        if (filePath) {
          logger.success(`✓ Loaded config from: ${filePath}`);
          if (isDebug) {
            logger.debug(`Config keys from ${filePath}: [${Object.keys(content).join(', ')}]`);
          }
          loadedSources.push(filePath);
        }

        config = content;
      } catch (err) {
        logger.error(
          `✗ Failed to load configuration from ${path}: ${err instanceof Error ? err.message : String(err)}`,
        );
        failedSources.push(path);
        continue;
      }
    }

    // Merge with existing config
    const beforeMergeKeys = Object.keys(mergedConfig);
    mergedConfig = deepMerge(mergedConfig, config);
    const afterMergeKeys = Object.keys(mergedConfig);

    if (isDebug && Object.keys(config).length > 0) {
      const newKeys = afterMergeKeys.filter((configKey) => !beforeMergeKeys.includes(configKey));
      const overriddenKeys = beforeMergeKeys.filter(
        (configKey) =>
          Object.keys(config).includes(configKey) &&
          JSON.stringify((mergedConfig as any)[configKey]) !==
            JSON.stringify((config as any)[configKey]),
      );

      if (newKeys.length > 0) {
        logger.debug(`New config keys added: [${newKeys.join(', ')}]`);
      }
      if (overriddenKeys.length > 0) {
        logger.debug(`Config keys merged/overridden: [${overriddenKeys.join(', ')}]`);
      }
    }
  }

  // Log final summary
  logger.info(`🎯 Configuration loading completed:`);
  logger.info(`  ✓ Successfully loaded: ${loadedSources.length} source(s)`);
  if (loadedSources.length > 0) {
    loadedSources.forEach((source) => logger.info(`    - ${source}`));
  }

  if (failedSources.length > 0) {
    logger.warn(`  ✗ Failed to load: ${failedSources.length} source(s)`);
    failedSources.forEach((source) => logger.warn(`    - ${source}`));
  }

  if (isDebug) {
    logger.debug(`Final merged config keys: [${Object.keys(mergedConfig).join(', ')}]`);
  }

  return mergedConfig;
}

/**
 * Check if value is an object
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}
