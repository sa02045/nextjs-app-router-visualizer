import _traverse from "@babel/traverse";
import fs from "node:fs";
import nodePath from "node:path";

import {
  hasRouterPush,
  getPathName,
  hasRouterPushJsxAttributeValue,
  getTrigger,
} from "./validNodePath.js";
import { getJsxAST } from "./ast.js";
import { addGraph, drawMermaidGraph, isCyclic } from "./graph.js";
import { fileURLToPath } from "node:url";

// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

interface StartArgs {
  entryPagePath: string;
  output: string;
}

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename).replace("/dist", "");

let APP_FOLDER_PATH = "";

export function start({ entryPagePath }: StartArgs) {
  const entry = nodePath.join(__dirname, entryPagePath);

  if (!fs.existsSync(entry)) {
    console.error(entry, "Entry page does not exist");
    return;
  }

  APP_FOLDER_PATH = entry.replace("/page.tsx", "");
  recursive(entry);
  drawMermaidGraph();
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
              componentName = childPath.node.id?.name as string;
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
              nextURL = getPathName(childPath);
              trigger = getTrigger(childPath, componentName);
            }
          },
        });
      }

      if (nextURL && trigger) {
        const startURL =
          filePath.replace(APP_FOLDER_PATH, "").replace("/page.tsx", "") || "/";

        if (isCyclic(startURL, nextURL)) {
          return;
        }

        addGraph(startURL, nextURL, trigger);

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
