import _traverse from "@babel/traverse";
import {
  hasRouterPush,
  getPathName,
  hasRouterPushJsxAttributeValue,
  getTrigger,
} from "./validNodePath.js";
import { getJsxAST } from "./ast.js";
import { addGraph, drawD2Graph, isCyclic } from "./graph.js";

// @ts-ignore
const traverse = _traverse.default as typeof _traverse;

const EXAMPLE_ENTRY_APP_FOLDER_PATH = "./example/src/app";
const EXAMPLE_ENTRY_FILE_PATH = EXAMPLE_ENTRY_APP_FOLDER_PATH + "/page.tsx";

const start = async (entryFilePath: string) => {
  recursive(entryFilePath);
};

function recursive(filePath: string) {
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
              trigger = getTrigger(childPath);
            }
          },
        });
      }

      if (nextURL && trigger) {
        const startURL =
          filePath
            .replace(EXAMPLE_ENTRY_APP_FOLDER_PATH, "")
            .replace("/page.tsx", "") || "/";

        if (isCyclic(startURL, nextURL)) {
          return;
        }

        addGraph(startURL, nextURL, trigger);

        const nextFilePath =
          EXAMPLE_ENTRY_APP_FOLDER_PATH + nextURL + "/page.tsx";

        recursive(nextFilePath);
      }
    },
  });
}

start(EXAMPLE_ENTRY_FILE_PATH);
drawD2Graph();

export default start;
