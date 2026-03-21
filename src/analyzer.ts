import _traverse, { type NodePath } from '@babel/traverse';
import type { ParseResult } from '@babel/parser';
import type { File, Node } from '@babel/types';
import nodePath from 'node:path';
import fs from 'node:fs';
import type { Edge } from './graph';
import {
  getFunctionName,
  getHistoryMethodName,
  getRouterMethodName,
  isHistoryStateCall,
  isInArrowFunctionExpression,
  isInFunctionDeclaration,
  isInJSXElement,
  isLinkNode,
  isNotFoundCall,
  isPermanentRedirectCall,
  isRedirectCall,
  isRouterMethodCall,
  parseHistoryStateURL,
  parseInLineJSXRouterNode,
  parseLinkNode,
  parseRedirectArguments,
  parseRouterArguments,
} from './node';

// Handle CJS/ESM interop: @babel/traverse exports differently depending on the module system
const traverse = (typeof _traverse === 'function'
  ? _traverse
  : (_traverse as unknown as { default: typeof _traverse }).default) as typeof _traverse;

export function analyzeFile(ast: ParseResult<File>, filePath: string, appFolderPath: string): Edge[] {
  const edges: Edge[] = [];
  const startURL = filePathToURL(filePath, appFolderPath);

  traverse(ast, {
    enter(path) {
      let nextURL = '';
      let trigger = '';

      // ── useRouter: push / replace ──
      if (isRouterMethodCall(path)) {
        const method = getRouterMethodName(path);

        if (method === 'push' || method === 'replace') {
          nextURL = parseRouterArguments(path);
          trigger = resolveCallTrigger(path, `router.${method}`);
        }

        if (method === 'back') {
          nextURL = '[back]';
          trigger = resolveCallTrigger(path, 'router.back');
        }

        if (method === 'forward') {
          nextURL = '[forward]';
          trigger = resolveCallTrigger(path, 'router.forward');
        }
      }

      // ── <Link> component ──
      if (isLinkNode(path)) {
        const linkInfo = parseLinkNode(path);
        nextURL = linkInfo.href;
        trigger = linkInfo.text || 'Link';
        if (linkInfo.isReplace && trigger) {
          trigger = `${trigger} (replace)`;
        }
      }

      // ── redirect() ──
      if (isRedirectCall(path)) {
        nextURL = parseRedirectArguments(path);
        trigger = 'redirect';
      }

      // ── permanentRedirect() ──
      if (isPermanentRedirectCall(path)) {
        nextURL = parseRedirectArguments(path);
        trigger = 'permanentRedirect';
      }

      // ── notFound() ──
      if (isNotFoundCall(path)) {
        nextURL = '/404';
        trigger = 'notFound';
      }

      // ── History API: pushState / replaceState ──
      if (isHistoryStateCall(path)) {
        const method = getHistoryMethodName(path);
        nextURL = parseHistoryStateURL(path);
        trigger = resolveCallTrigger(path, `history.${method}`);
      }

      if (nextURL && trigger) {
        const resolvedURL = resolveURL(nextURL, startURL);
        edges.push({ startURL, endURL: resolvedURL, trigger });
      }
    },
  });

  return edges;
}

/**
 * Resolve the trigger name for a call expression.
 * Checks context:
 *   1. JSX inline handler → attribute name (onClick, onSubmit, etc.)
 *   2. Named function declaration → function name
 *   3. Variable-assigned function expression → variable name
 *   4. Fallback → provided default
 */
function resolveCallTrigger(path: NodePath<Node>, fallback: string): string {
  // JSX inline: <button onClick={() => router.push(...)}>
  if (isInJSXElement(path) && isInArrowFunctionExpression(path)) {
    return parseInLineJSXRouterNode(path) || fallback;
  }

  // Named function declaration: function handleClick() { router.push(...) }
  if (isInFunctionDeclaration(path)) {
    return getFunctionName(path) || fallback;
  }

  // Variable-assigned function: const handleClick = () => { router.push(...) }
  const varName = getEnclosingVariableName(path);
  if (varName) return varName;

  return fallback;
}

/**
 * If the call is inside a variable-assigned arrow/function expression,
 * return the variable name. Otherwise return empty string.
 *   const handleNav = () => { router.push(...) }  →  "handleNav"
 *   const go = function() { router.push(...) }    →  "go"
 */
function getEnclosingVariableName(path: NodePath<Node>): string {
  let name = '';
  path.findParent(p => {
    if (p.isVariableDeclarator()) {
      const id = p.get('id');
      if (id.isIdentifier()) {
        name = id.node.name;
        return true;
      }
    }
    return false;
  });
  return name;
}

/**
 * Resolve a URL relative to the current page's URL.
 * - Absolute paths ("/about") are returned as-is
 * - Relative paths ("./detail", "../") are resolved against baseURL
 * - Non-path URLs ("[back]", "https://...", "#anchor") are returned as-is
 */
function resolveURL(url: string, baseURL: string): string {
  // Already absolute, external, or special
  if (url.startsWith('/') || url.startsWith('[') || url.startsWith('#') || url.includes('://')) {
    return url;
  }

  // Relative path: resolve against baseURL
  const base = baseURL === '/' ? '' : baseURL;
  const resolved = nodePath.posix.resolve(base, url);
  return resolved || '/';
}

const LOCAL_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/**
 * Extract local relative import paths from a file's AST.
 * Returns resolved absolute file paths for imports like './component' or '../utils'.
 * Skips package imports ('next/link', 'react', etc.).
 */
export function extractLocalImports(ast: ParseResult<File>, filePath: string): string[] {
  const dir = nodePath.dirname(filePath);
  const imports: string[] = [];

  traverse(ast, {
    enter(path) {
      if (!path.isImportDeclaration()) return;
      const source = path.node.source.value;

      // Only relative imports
      if (!source.startsWith('.')) return;

      const resolved = resolveImportPath(dir, source);
      if (resolved) imports.push(resolved);
    },
  });

  return imports;
}

function resolveImportPath(dir: string, importSource: string): string | null {
  const base = nodePath.resolve(dir, importSource);

  // Try exact path first (already has extension)
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  // Try with extensions
  for (const ext of LOCAL_EXTENSIONS) {
    const withExt = base + ext;
    if (fs.existsSync(withExt)) return withExt;
  }

  // Try as directory with index file
  for (const ext of LOCAL_EXTENSIONS) {
    const indexFile = nodePath.join(base, `index${ext}`);
    if (fs.existsSync(indexFile)) return indexFile;
  }

  return null;
}

function filePathToURL(filePath: string, appFolderPath: string): string {
  const rawURL = nodePath.dirname(filePath).replace(appFolderPath, '') || '/';
  return stripRouteGroups(rawURL);
}

/**
 * Remove route group segments from URL path.
 * Route groups like `(marketing)` or `(auth)` affect file layout but not URLs.
 */
function stripRouteGroups(urlPath: string): string {
  return urlPath
    .split('/')
    .filter(segment => !segment.match(/^\(.*\)$/))
    .join('/') || '/';
}
