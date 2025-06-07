/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Common interface for command options
 * Used to define the shape of options shared between CLI commands
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
