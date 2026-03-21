#!/usr/bin/env node

import cac from 'cac';
import { start } from './index.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPageFile } from './utils.js';

const cli = cac('nextjs-app-router-visualizer');

cli.help();
cli.option('--entry <filepath>', 'Entry page file path');
cli.option('--format <format>', 'Output format: html (default) or json');

const parsed = cli.parse();

const entryFromArgs = parsed.options.entry;

let entryPagePath;

if (entryFromArgs) {
  entryPagePath = path.resolve(process.cwd(), entryFromArgs);
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptRelativeAppDir = path.join(__dirname, '..', 'app');

  entryPagePath =
    findPageFile(path.join(process.cwd(), 'app')) ||
    findPageFile(path.join(process.cwd(), 'src', 'app')) ||
    findPageFile(scriptRelativeAppDir) ||
    '';
}

console.log('Using entry page path:', entryPagePath);

const format = parsed.options.format === 'json' ? 'json' : 'html';

start({
  entryPagePath,
  output: format === 'json' ? 'graph.json' : 'graph.html',
  format,
});
