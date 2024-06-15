import _traverse from "@babel/traverse";
import fs from "node:fs";
import nodePath from "node:path";
import { isLinkNode, parseLinkNode } from "./nodePath.js";

import {
  hasRouterPush,
  getPathName,
  hasRouterPushJsxAttributeValue,
} from "./nodePath.js";
import { getJsxAST } from "./ast.js";
import { graph } from "./graph.js";

// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

interface StartArgs {
  entryPagePath: string;
  output: string;
}

let APP_FOLDER_PATH = "./app";

export function start({ entryPagePath }: StartArgs) {
  if (!fs.existsSync(entryPagePath)) {
    console.error(entryPagePath, "Entry page does not exist");
    return;
  }

  APP_FOLDER_PATH = nodePath.join(entryPagePath.split("app")[0], "app");

  recursive(entryPagePath);

  graph.drawMermaidGraph();
}

function recursive(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(filePath, "File does not exist");
    return;
  }

  const ast = getJsxAST(filePath);

  let componentName: string = "";

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
      let nextURL = "";
      let trigger = "";
      if (path.isJSXOpeningElement()) {
        path.traverse({
          enter(childPath) {
            const { result, trigger: _trigger } =
              hasRouterPushJsxAttributeValue(childPath);
            if (result) {
              trigger = _trigger;
            }
            if (hasRouterPush(childPath)) {
              nextURL = getPathName(childPath);
            }
          },
        });
      }

      if (path.isFunctionDeclaration()) {
        path.traverse({
          enter(childPath) {
            if (hasRouterPush(childPath)) {
              if (componentName !== path.node.id.name) {
                nextURL = getPathName(childPath);
                trigger = path.node.id.name;
              }
            }
          },
        });
      }

      if (isLinkNode(path)) {
        const linkInfo = parseLinkNode(path);
        nextURL = linkInfo.href;
        trigger = linkInfo.text;
      }

      if (nextURL && trigger) {
        const startURL =
          filePath.split("app")[1].replace("/page.tsx", "") || "/";

        if (graph.isCycle(startURL, { startURL, endURL: nextURL, trigger })) {
          return;
        }

        graph.addEdge(startURL, {
          startURL,
          endURL: nextURL,
          trigger,
        });

        const nextFilePath = nodePath.join(
          APP_FOLDER_PATH,
          nextURL,
          "page.tsx"
        );

        recursive(nextFilePath);
      }
    },
  });
}
