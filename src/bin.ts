#!/usr/bin/env node

import cac from 'cac';
import chalk from 'chalk';
import { start, type OutputFormat } from './index.js';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const cli = cac('nextjs-app-router-visualizer');

cli.version(version);
cli.help();

cli.option('--entry <filepath>', 'Entry page file path (auto-detected if omitted)');
cli.option('--format <format>', 'Output format: html (default) or json');
cli.option('--output <filepath>', 'Output file path (default: graph.html or graph.json)');

const parsed = cli.parse();

// --help and --version are handled by cac, exit early
if (parsed.options.help || parsed.options.version) {
  process.exit(0);
}

const entryPagePath = parsed.options.entry
  ? path.resolve(process.cwd(), parsed.options.entry)
  : '';

const format: OutputFormat = parsed.options.format === 'json' ? 'json' : 'html';
const output = parsed.options.output || (format === 'json' ? 'graph.json' : 'graph.html');

const success = start({ entryPagePath, output, format });

if (!success) {
  console.log('');
  console.log(chalk.dim('Usage: npx nextjs-app-router-visualizer --entry app/page.tsx'));
  process.exit(1);
}
