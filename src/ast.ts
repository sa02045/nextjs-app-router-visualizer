import { parse } from '@babel/parser';
import fs from 'node:fs';

export function getJsxAST(path: string) {
  const code = fs.readFileSync(path, 'utf-8');
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
}
