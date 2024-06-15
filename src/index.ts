import _traverse from "@babel/traverse";
import fs from "node:fs";
import nodePath from "node:path";

import {
  hasRouterPush,
  getPathName,
  hasRouterPushJsxAttributeValue,
} from "../validNodePath.js";
import { getJsxAST } from "../ast.js";
import { addGraph, drawMermaidGraph, isCyclic } from "../graph.js";

// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

interface StartArgs {
  entryPagePath: string;
  output: string;
}

let APP_FOLDER_PATH = "";

export function start({ entryPagePath }: StartArgs) {
  const entry = entryPagePath;

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
      if (path.isJSXIdentifier() && path.node.name === "Link") {
        const jsxLinkElement = path.findParent((p) => p.isJSXElement());
        if (jsxLinkElement) {
          jsxLinkElement.traverse({
            enter(childPath) {
              if (childPath.isJSXText()) {
                trigger = childPath.node.value;
              }

              if (childPath.isJSXAttribute()) {
                const name = childPath.get("name");
                const value = childPath.get("value");
                if (
                  name.isJSXIdentifier({ name: "href" }) &&
                  value.isStringLiteral()
                ) {
                  nextURL = value.node.value;
                }
              }
            },
          });
        }
      }

      if (nextURL && trigger) {
        const startURL =
          filePath
            .replace(APP_FOLDER_PATH, "")
            .replace("/app", "")
            .replace("/page.tsx", "") || "/";

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
