#!/usr/bin/env node
/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI tool for evaluating prompts using the Ultimate Prompt Evaluator (UPE)
 *
 * Usage:
 *   pnpm upe:eval "Your prompt here"
 *   pnpm upe:eval --file path/to/prompt.txt
 *   pnpm upe:optimize "Your prompt here"
 */

import { readFileSync } from 'fs';
import { evaluatePrompt, optimizePrompt } from '../src/node/prompt-evaluator';

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
Ultimate Prompt Evaluator (UPE) CLI

Usage:
  node cli/evaluate.ts [command] [options] <prompt>

Commands:
  eval      Evaluate a prompt (default)
  optimize  Get optimization suggestions

Options:
  --file <path>    Read prompt from file
  --help           Show this help message

Examples:
  node cli/evaluate.ts "You are a helpful assistant"
  node cli/evaluate.ts --file prompts/system.txt
  node cli/evaluate.ts optimize "Simple task"
  `);
}

function formatScore(score: number): string {
  const bar = '█'.repeat(Math.round(score)) + '░'.repeat(10 - Math.round(score));
  const grade = score >= 9 ? '🟢' : score >= 7 ? '🟡' : score >= 5 ? '🟠' : '🔴';
  return `${grade} ${bar} ${score.toFixed(1)}/10`;
}

function main() {
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  let command = 'eval';
  let prompt = '';
  let fileMode = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'eval' || arg === 'optimize') {
      command = arg;
    } else if (arg === '--file') {
      fileMode = true;
      const filePath = args[++i];
      if (!filePath) {
        console.error('Error: --file requires a path argument');
        process.exit(1);
      }
      try {
        prompt = readFileSync(filePath, 'utf-8');
      } catch (error: any) {
        console.error(`Error reading file: ${error.message}`);
        process.exit(1);
      }
    } else if (!arg.startsWith('--')) {
      prompt = arg;
    }
  }

  if (!prompt) {
    console.error('Error: No prompt provided');
    printUsage();
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Ultimate Prompt Evaluator (UPE)                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (command === 'eval') {
    console.log('📝 Evaluating Prompt...\n');

    const result = evaluatePrompt(prompt);

    // Display scores
    console.log('📊 EVALUATION SCORES\n');
    console.log('  Overall Score:');
    console.log(`    ${formatScore(result.overallScore)}\n`);

    console.log('  Category Breakdown:');
    console.log(`    Clarity:                  ${formatScore(result.score.clarity)}`);
    console.log(`    Accuracy:                 ${formatScore(result.score.accuracy)}`);
    console.log(`    Robustness:               ${formatScore(result.score.robustness)}`);
    console.log(`    Resource Efficiency:      ${formatScore(result.score.resourceEfficiency)}`);
    console.log(`    Ethical Alignment:        ${formatScore(result.score.ethicalAlignment)}`);
    console.log(`    Tool Integration:         ${formatScore(result.score.toolIntegration)}`);
    console.log(
      `    Multi-Modal Adaptability: ${formatScore(result.score.multiModalAdaptability)}`,
    );

    // Display strengths
    if (result.strengths.length > 0) {
      console.log('\n✅ STRENGTHS\n');
      result.strengths.forEach((strength) => {
        console.log(`  • ${strength}`);
      });
    }

    // Display weaknesses
    if (result.weaknesses.length > 0) {
      console.log('\n⚠️  WEAKNESSES\n');
      result.weaknesses.forEach((weakness) => {
        console.log(`  • ${weakness}`);
      });
    }

    // Display triggered pathways
    if (result.triggeredPathways.length > 0) {
      console.log('\n🎯 TRIGGERED OPTIMIZATION PATHWAYS\n');
      result.triggeredPathways.forEach((pathway) => {
        console.log(`  • ${pathway}`);
      });
    }

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS\n');
      result.recommendations.slice(0, 5).forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
      if (result.recommendations.length > 5) {
        console.log(`  ... and ${result.recommendations.length - 5} more`);
      }
    }

    // Display analysis
    console.log('\n📋 DETAILED ANALYSIS\n');
    result.analysis.split('\n').forEach((line) => {
      console.log(`  ${line}`);
    });
  } else if (command === 'optimize') {
    console.log('🔧 Generating Optimization Suggestions...\n');

    const { changes } = optimizePrompt(prompt);

    console.log('💡 SUGGESTED CHANGES\n');
    if (changes.length > 0) {
      changes.forEach((change, idx) => {
        console.log(`  ${idx + 1}. ${change}`);
      });
    } else {
      console.log('  No specific optimization suggestions at this time.');
      console.log('  Your prompt is already well-structured!');
    }
  }

  console.log('\n' + '─'.repeat(64) + '\n');
}

main();
