import { parse, type ParseResult } from '@babel/parser';
import type { File } from '@babel/types';
import fs from 'node:fs';
import chalk from 'chalk';

export function parseSourceFile(filePath: string): ParseResult<File> | null {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    return parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Failed to parse ${filePath}: ${message}`));
    return null;
  }
}
