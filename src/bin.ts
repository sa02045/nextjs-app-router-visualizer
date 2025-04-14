#!/usr/bin/env node

import cac from 'cac';
import { start } from './index.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const cli = cac('nextjs-app-router-visualizer');

cli.help();
cli.option('--entry <filepath>', 'Entry page file path');

const parsed = cli.parse();

const entryFromArgs = parsed.options.entry;

let entryPagePath;

if (entryFromArgs) {
  entryPagePath = path.resolve(process.cwd(), entryFromArgs);
} else {
  const cwdAppPath = path.join(process.cwd(), 'app', 'page.tsx');
  const cwdSrcAppPath = path.join(process.cwd(), 'src', 'app', 'page.tsx');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptRelativePath = path.join(__dirname, '..', 'app', 'page.tsx');

  if (fs.existsSync(cwdAppPath)) {
    entryPagePath = cwdAppPath;
  } else if (fs.existsSync(cwdSrcAppPath)) {
    entryPagePath = cwdSrcAppPath;
  } else if (fs.existsSync(scriptRelativePath)) {
    entryPagePath = scriptRelativePath;
  }
}

console.log('Using entry page path:', entryPagePath);

start({
  entryPagePath,
  output: 'graph.html',
});
