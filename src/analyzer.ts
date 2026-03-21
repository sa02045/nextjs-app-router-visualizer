import _traverse, { type NodePath } from '@babel/traverse';
import type { ParseResult } from '@babel/parser';
import type { File, Node } from '@babel/types';
import nodePath from 'node:path';
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

export function extractComponentName(ast: ParseResult<File>): string {
  let componentName = '';

  traverse(ast, {
    enter(path) {
      if (path.isExportDefaultDeclaration()) {
        path.traverse({
          enter(childPath) {
            if (childPath.isFunctionDeclaration()) {
              componentName = childPath.node.id?.name ?? '';
              childPath.stop();
              path.stop();
            }
          },
        });
      }
    },
  });

  return componentName;
}

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
        edges.push({ startURL, endURL: nextURL, trigger });
      }
    },
  });

  return edges;
}

/**
 * Resolve the trigger name for a call expression.
 * Checks context: JSX inline handler → attribute name,
 * function declaration → function name, fallback → provided default.
 */
function resolveCallTrigger(path: NodePath<Node>, fallback: string): string {
  if (isInJSXElement(path)) {
    if (isInArrowFunctionExpression(path)) {
      return parseInLineJSXRouterNode(path) || fallback;
    }
  }

  if (!isInJSXElement(path) && isInFunctionDeclaration(path)) {
    return getFunctionName(path) || fallback;
  }

  return fallback;
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
