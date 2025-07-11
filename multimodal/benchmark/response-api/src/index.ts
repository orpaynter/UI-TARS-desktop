/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { BenchmarkRunner } from './benchmark-runner';
import { FCStrategy, GUIStrategy, MCPStrategy } from './strategies';
import { BenchmarkConfig } from './types';

/**
 * Main entry point for response API benchmark
 *
 * This script tests different task strategies (GUI, FC, MCP) against both
 * response API and chat completion API to compare their performance.
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm start [options]

Options:
  --save, -s              Save results to disk
  --runs=<number>         Number of runs per strategy (default: 3)
  --task=<type>          Filter by task type (gui, fc, mcp)
  --dump-history, --dump  Enable message history dumping for debugging
  --model=<model-id>      Specify model ID to use for all strategies
  --help, -h              Show this help message

Examples:
  npm start --runs=5 --save
  npm start --task=gui --dump-history
  npm start --model=ep-20250613182556-7z8pl --runs=1
    `);
    process.exit(0);
  }

  const saveToDisk = args.includes('--save') || args.includes('-s');
  const runsPerStrategy = parseInt(
    args.find((arg) => arg.startsWith('--runs='))?.split('=')[1] || '3',
  );
  const taskType = args.find((arg) => arg.startsWith('--task='))?.split('=')[1];
  const dumpMessageHistory = args.includes('--dump-history') || args.includes('--dump');
  const modelId = args.find((arg) => arg.startsWith('--model='))?.split('=')[1];

  // Define strategies to test
  const allStrategies = [new FCStrategy(), new GUIStrategy(), new MCPStrategy()];

  // Filter strategies based on task type if specified
  const strategies = taskType
    ? allStrategies.filter((s) => s.taskType === taskType)
    : allStrategies;

  if (strategies.length === 0) {
    console.error(`No strategies found for task type: ${taskType}`);
    console.error('Available task types: gui, fc, mcp');
    console.error('Use --help for more information');
    process.exit(1);
  }

  const config: BenchmarkConfig = {
    strategies,
    runsPerStrategy,
    collectMemoryUsage: false, // Set to true if --expose-gc flag is used
    saveToDisk,
    outputDir: 'result',
    dumpMessageHistory,
    modelId,
    // timeout: 300000, // 5 minutes timeout
  };

  // Initialize benchmark runner
  const benchmarkRunner = new BenchmarkRunner();

  try {
    console.log('🚀 Starting benchmark...');

    // Run benchmark
    const results = await benchmarkRunner.runBenchmark(strategies, config);

    // Present results
    benchmarkRunner.presentResults(results);

    console.log('\n✅ Benchmark completed successfully!');

    if (saveToDisk) {
      console.log(`📁 Results saved to: ${config.outputDir}`);
    }
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
