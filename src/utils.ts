import fs from 'node:fs';
import nodePath from 'node:path';

const PAGE_EXTENSIONS = ['tsx', 'jsx', 'ts', 'js'];

export function findPageFile(dir: string): string | null {
  for (const ext of PAGE_EXTENSIONS) {
    const filePath = nodePath.join(dir, `page.${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}
