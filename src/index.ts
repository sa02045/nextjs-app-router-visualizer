import _traverse from '@babel/traverse';
import fs from 'node:fs';
import nodePath from 'node:path';
import {
  getFunctionName,
  isInArrowFunctionExpression,
  isInFunctionDeclaration,
  isInJSXElement,
  isLinkNode,
  parseInLineJSXRouterNode,
  parseLinkNode,
  parseRouterArguments,
} from './node';

import { isRouterNode } from './node';
import { getJsxAST } from './ast.js';
import { graph } from './graph.js';
import { APP_PATH_WITHOUT_SRC, APP_PATH_WITH_SRC } from './constants.js';

// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

interface StartArgs {
  entryPagePath: string;
  output: string;
}

let APP_FOLDER_PATH = '';

export function start({ entryPagePath }: StartArgs) {
  if (!entryPagePath) {
    if (fs.existsSync(APP_PATH_WITH_SRC)) {
      entryPagePath = APP_PATH_WITH_SRC;
    } else if (fs.existsSync(APP_PATH_WITHOUT_SRC)) {
      entryPagePath = APP_PATH_WITHOUT_SRC;
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

  APP_FOLDER_PATH = pathParts.slice(0, appIndex + 1).join(nodePath.sep);
  console.log('Using APP_FOLDER_PATH:', APP_FOLDER_PATH);

  recursive(normalizedPath);

  graph.drawMermaidGraph();
}

function getDynamicRouteFolder(filePath: string) {
  const paths = filePath.replace('/page.tsx', '').split('/');
  paths.pop();
  const folderPath = [...paths].join('/');

  let dynamicRoute = null;

  fs.readdirSync(folderPath).forEach(file => {
    if (file.startsWith('[') && file.endsWith(']')) {
      dynamicRoute = folderPath + '/' + file;
    }
  });

  return dynamicRoute;
}

function recursive(filePath: string) {
  if (!fs.existsSync(filePath)) {
    const folderName = getDynamicRouteFolder(filePath);
    if (folderName) {
      filePath = nodePath.join(folderName, 'page.tsx');
    } else {
      console.error(filePath, 'File does not exist');
      return;
    }
  }

  const ast = getJsxAST(filePath);

  let componentName: string = '';

  traverse(ast, {
    enter(path) {
      if (path.isExportDefaultDeclaration()) {
        path.traverse({
          enter(childPath) {
            if (childPath.isFunctionDeclaration()) {
              componentName = childPath.node.id.name;
              childPath.stop();
              path.stop();
            }
          },
        });
      }
    },
  });

  traverse(ast, {
    enter(path) {
      let nextURL = '';
      let trigger = '';

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

      if (isLinkNode(path)) {
        const linkInfo = parseLinkNode(path);
        nextURL = linkInfo.href;
        trigger = linkInfo.text;
      }

      if (nextURL && trigger) {
        const startURL = nodePath.dirname(filePath).replace(APP_FOLDER_PATH, '') || '/';

        if (graph.isDuplicateEdge(startURL, { startURL, endURL: nextURL, trigger })) {
          return;
        }

        graph.addEdge(startURL, {
          startURL,
          endURL: nextURL,
          trigger,
        });

        const nextFilePath = nodePath.join(APP_FOLDER_PATH, nextURL, 'page.tsx');

        recursive(nextFilePath);
      }
    },
  });
}
