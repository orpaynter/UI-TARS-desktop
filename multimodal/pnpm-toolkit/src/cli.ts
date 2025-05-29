/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CLI entry point for PTK
 */
import { cac } from 'cac';
import { dev, release, patch, changelog } from './index';
import { logger } from './utils/logger';

/**
 * Wraps a command execution with error handling
 */
async function wrapCommand(command: Function, options: Record<string, unknown>) {
  options.cwd = options.cwd || process.cwd();

  try {
    await command(options);
  } catch (err) {
    console.log();
    process.exitCode = 1;
    logger.error((err as Error).message);
    console.log();
  }
}

/**
 * Bootstrap the CLI
 */
export function bootstrapCli() {
  const cli = cac('ptk');
  const pkg = require('../package.json');

  // Global options
  cli.option('--cwd <cwd>', 'Current working directory');

  // Dev command
  cli
    .command('d', 'Quickly launch on-demand development build for monorepo')
    .alias('dev')
    .action((opts) => wrapCommand(dev, opts));

  // Release command
  cli
    .command('r', 'Release your monorepo')
    .option('--changelog', 'Whether to generate changelog')
    .option('--dry-run', 'Preview execution')
    .option('--run-in-band', 'Whether to publish package in series')
    .option('--build [build]', 'Execute custom build script before release')
    .option('--ignore-scripts', 'Ignore npm scripts under release and patch process')
    .option('--push-tag', 'Automatically push git tag to remote')
    .alias('release')
    .action((opts) => {
      opts = {
        changelog: true,
        ...opts,
      };
      return wrapCommand(release, opts);
    });

  // Patch command
  cli
    .command('p', 'Patch the failure of release process')
    .option('--version <version>', 'Version (e.g. 1.0.0, 2.0.0-alpha.9)')
    .option('--tag <tag>', 'Tag (e.g. latest, next, beta)')
    .option('--run-in-band', 'Whether to publish package in series')
    .option('--ignore-scripts', 'Ignore npm scripts under patch process')
    .alias('patch')
    .action((opts) => wrapCommand(patch, opts));

  // Changelog command
  cli
    .command('changelog', 'Create changelog')
    .option('--version <version>', 'Version, defaults to version in package.json')
    .option('--beautify', 'Beautify changelog or not, defaults to false')
    .option('--commit', 'Create git commit or not, defaults to false')
    .option('--git-push', 'Execute git push or not, defaults to false')
    .option('--attach-author', 'Add author or not, defaults to false')
    .option('--author-name-type <type>', 'Type of author name: name or email, defaults to name')
    .action((opts) => wrapCommand(changelog, opts));

  cli.version(pkg.version);
  cli.help();

  cli.parse();
}
