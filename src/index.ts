import fs from 'node:fs';
import nodePath from 'node:path';
import chalk from 'chalk';
import { parseSourceFile } from './ast.js';
import { analyzeFile, extractLocalImports } from './analyzer.js';
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

/**
 * Main entry point. Returns true on success, false on failure.
 */
export function start({ entryPagePath, output, format = 'html' }: StartArgs): boolean {
  if (!entryPagePath) {
    const cwdApp = nodePath.join(process.cwd(), 'src', 'app');
    const cwdAppNoSrc = nodePath.join(process.cwd(), 'app');

    const found = findPageFile(cwdApp) || findPageFile(cwdAppNoSrc);
    if (found) {
      entryPagePath = found;
    } else {
      console.error(chalk.red('Error:'), "Can't find entry page file. Use --entry flag to specify.");
      return false;
    }
  }
  if (!fs.existsSync(entryPagePath)) {
    console.error(chalk.red('Error:'), `Entry file not found: ${chalk.dim(entryPagePath)}`);
    return false;
  }

  const normalizedPath = nodePath.normalize(entryPagePath);
  const pathParts = normalizedPath.split(nodePath.sep);

  const appIndex = pathParts.findIndex(part => part === 'app');

  if (appIndex === -1) {
    console.error(chalk.red('Error:'), `Cannot find 'app' directory in: ${chalk.dim(entryPagePath)}`);
    return false;
  }

  const appFolderPath = pathParts.slice(0, appIndex + 1).join(nodePath.sep);

  console.log(chalk.blue('Entry:'), chalk.dim(entryPagePath));
  console.log(chalk.blue('App dir:'), chalk.dim(appFolderPath));

  const context: TraversalContext = {
    appFolderPath,
    graph: new Graph(),
    visited: new Set(),
  };

  recursive(normalizedPath, context);

  if (context.graph.isEmpty()) {
    console.log(chalk.yellow('Warning:'), 'No navigation edges found.');
    return true;
  }

  const nodeCount = context.graph.getNodes().length;
  const edgeCount = context.graph.getAllEdges().length;

  renderGraph(context.graph, output, format);
  console.log(chalk.green('Done!'), `${nodeCount} pages, ${edgeCount} edges → ${chalk.dim(output)}`);
  return true;
}

/**
 * Check if a URL is a local route that can be recursively traversed.
 * Excludes external URLs, special nodes, and anchor-only links.
 */
function isTraversableURL(url: string): boolean {
  // External URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return false;
  // Special synthetic nodes
  if (url.startsWith('[') || url === '/404') return false;
  // Anchor-only or query-only
  if (url.startsWith('#') || url.startsWith('?')) return false;
  // mailto, tel, etc.
  if (url.includes(':')) return false;
  return true;
}

/**
 * Find a dynamic route folder inside a directory.
 * Supports: [id], [...slug], [[...slug]]
 * Prefers specific dynamic ([id]) over catch-all ([...slug]) over optional catch-all ([[...slug]]).
 */
function getDynamicRouteFolder(dir: string): string | null {
  let specific: string | null = null;
  let catchAll: string | null = null;
  let optionalCatchAll: string | null = null;

  try {
    for (const file of fs.readdirSync(dir)) {
      if (file.startsWith('[[') && file.endsWith(']]')) {
        optionalCatchAll = nodePath.join(dir, file);
      } else if (file.startsWith('[...') && file.endsWith(']')) {
        catchAll = nodePath.join(dir, file);
      } else if (file.startsWith('[') && file.endsWith(']')) {
        specific = nodePath.join(dir, file);
      }
    }
  } catch {
    return null;
  }

  return specific || catchAll || optionalCatchAll;
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
    console.warn(chalk.yellow('Warning:'), `File not found: ${chalk.dim(filePath)}`);
    return;
  }

  const ast = parseSourceFile(filePath);
  if (!ast) return;

  // Analyze the page file itself
  const edges = analyzeFile(ast, filePath, context.appFolderPath);

  // Also analyze locally imported components (they may contain navigation)
  const localImports = extractLocalImports(ast, filePath);
  for (const importPath of localImports) {
    const resolvedImport = nodePath.resolve(importPath);
    if (context.visited.has(resolvedImport)) continue;
    // Mark as visited but don't add as a page — just extract edges
    context.visited.add(resolvedImport);

    const importAst = parseSourceFile(importPath);
    if (!importAst) continue;

    const importEdges = analyzeFile(importAst, filePath, context.appFolderPath);
    edges.push(...importEdges);
  }

  for (const edge of edges) {
    const added = context.graph.addEdge(edge);
    if (!added) continue;

    // Skip recursion for non-navigable edges
    if (!isTraversableURL(edge.endURL)) continue;

    const nextDir = nodePath.join(context.appFolderPath, edge.endURL);
    const nextFilePath = resolvePagePath(nextDir);

    if (!nextFilePath) {
      console.warn(chalk.yellow('Warning:'), `No page file for route ${chalk.dim(edge.endURL)}`);
    } else {
      recursive(nextFilePath, context);
    }
  }
}
