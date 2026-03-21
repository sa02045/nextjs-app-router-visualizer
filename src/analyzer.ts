import _traverse from '@babel/traverse';
import type { ParseResult } from '@babel/parser';
import type { File } from '@babel/types';
import nodePath from 'node:path';
import {
  getFunctionName,
  isInArrowFunctionExpression,
  isInFunctionDeclaration,
  isInJSXElement,
  isLinkNode,
  isNotFoundCall,
  isRedirectCall,
  isRouterNode,
  parseInLineJSXRouterNode,
  parseLinkNode,
  parseRedirectArguments,
  parseRouterArguments,
} from './node';

// Handle CJS/ESM interop: @babel/traverse exports differently depending on the module system
const traverse = (typeof _traverse === 'function'
  ? _traverse
  : (_traverse as unknown as { default: typeof _traverse }).default) as typeof _traverse;

export interface NavigationEdge {
  startURL: string;
  endURL: string;
  trigger: string;
}

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

export function analyzeFile(ast: ParseResult<File>, filePath: string, appFolderPath: string): NavigationEdge[] {
  const edges: NavigationEdge[] = [];
  const startURL = filePathToURL(filePath, appFolderPath);

  traverse(ast, {
    enter(path) {
      let nextURL = '';
      let trigger = '';

      // Router.push / Router.replace
      if (isRouterNode(path)) {
        if (isInJSXElement(path)) {
          if (isInArrowFunctionExpression(path)) {
            trigger = parseInLineJSXRouterNode(path);
            nextURL = parseRouterArguments(path);
          }
        }

        if (!isInJSXElement(path) && isInFunctionDeclaration(path)) {
          trigger = getFunctionName(path);
          nextURL = parseRouterArguments(path);
        }
      }

      // <Link> component
      if (isLinkNode(path)) {
        const linkInfo = parseLinkNode(path);
        nextURL = linkInfo.href;
        trigger = linkInfo.text;
      }

      // redirect()
      if (isRedirectCall(path)) {
        nextURL = parseRedirectArguments(path);
        trigger = 'redirect';
      }

      // notFound()
      if (isNotFoundCall(path)) {
        nextURL = '/404';
        trigger = 'notFound';
      }

      if (nextURL && trigger) {
        edges.push({ startURL, endURL: nextURL, trigger });
      }
    },
  });

  return edges;
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
