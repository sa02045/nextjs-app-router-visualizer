import fs from 'node:fs';
import nodePath from 'node:path';
import { parseSourceFile } from './ast.js';
import { analyzeFile } from './analyzer.js';
import { Graph } from './graph.js';
import { type OutputFormat, renderGraph } from './renderer.js';
import { findPageFile } from './utils.js';

export type { OutputFormat };

interface StartArgs {
  entryPagePath: string;
  output: string;
  format?: OutputFormat;
}

interface TraversalContext {
  appFolderPath: string;
  graph: Graph;
  visited: Set<string>;
}

export function start({ entryPagePath, output, format = 'html' }: StartArgs) {
  if (!entryPagePath) {
    const cwdApp = nodePath.join(process.cwd(), 'src', 'app');
    const cwdAppNoSrc = nodePath.join(process.cwd(), 'app');

    const found = findPageFile(cwdApp) || findPageFile(cwdAppNoSrc);
    if (found) {
      entryPagePath = found;
    } else {
      console.error("Can't find entry page file. Use --entry flag to specify");
      return;
    }
  }
  if (!fs.existsSync(entryPagePath)) {
    console.error("Can't find entry page file");
    return;
  }

  const normalizedPath = nodePath.normalize(entryPagePath);
  const pathParts = normalizedPath.split(nodePath.sep);

  const appIndex = pathParts.findIndex(part => part === 'app');

  if (appIndex === -1) {
    console.error("Cannot find 'app' directory in the entry path:", entryPagePath);
    return;
  }

  const appFolderPath = pathParts.slice(0, appIndex + 1).join(nodePath.sep);
  console.log('Using APP_FOLDER_PATH:', appFolderPath);

  const context: TraversalContext = {
    appFolderPath,
    graph: new Graph(),
    visited: new Set(),
  };

  recursive(normalizedPath, context);

  renderGraph(context.graph, output, format);
}

function getDynamicRouteFolder(dir: string): string | null {
  let dynamicRoute: string | null = null;

  try {
    fs.readdirSync(dir).forEach(file => {
      if (file.startsWith('[') && file.endsWith(']')) {
        dynamicRoute = nodePath.join(dir, file);
      }
    });
  } catch {
    return null;
  }

  return dynamicRoute;
}

function resolvePagePath(dir: string): string | null {
  // Try direct page file lookup
  const pageFile = findPageFile(dir);
  if (pageFile) return pageFile;

  // Try dynamic route folder
  const dynamicFolder = getDynamicRouteFolder(dir);
  if (dynamicFolder) {
    return findPageFile(dynamicFolder);
  }

  // Try route group subdirectories: (group)/page.tsx
  try {
    for (const entry of fs.readdirSync(dir)) {
      if (entry.match(/^\(.*\)$/)) {
        const groupFile = findPageFile(nodePath.join(dir, entry));
        if (groupFile) return groupFile;
      }
    }
  } catch {
    // directory doesn't exist
  }

  return null;
}

function recursive(filePath: string, context: TraversalContext) {
  const resolvedPath = nodePath.resolve(filePath);
  if (context.visited.has(resolvedPath)) return;
  context.visited.add(resolvedPath);

  if (!fs.existsSync(filePath)) {
    console.error(filePath, 'File does not exist');
    return;
  }

  const ast = parseSourceFile(filePath);
  if (!ast) return;

  const edges = analyzeFile(ast, filePath, context.appFolderPath);

  for (const edge of edges) {
    const added = context.graph.addEdge(edge);
    if (!added) continue;

    const nextDir = nodePath.join(context.appFolderPath, edge.endURL);
    const nextFilePath = resolvePagePath(nextDir);

    if (nextFilePath) {
      recursive(nextFilePath, context);
    } else {
      console.error(`Page file not found in ${nextDir}`);
    }
  }
}
