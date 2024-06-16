// src/index.ts
import _traverse from "@babel/traverse";
import fs3 from "node:fs";
import nodePath from "node:path";

// src/nodePath.ts
function isLinkNode(path2) {
  return path2.isJSXElement() && path2.get("openingElement").get("name").isJSXIdentifier({ name: "Link" });
}
function parseLinkNode(linkNodePath) {
  let href = "";
  let text = "";
  linkNodePath.traverse({
    enter(path2) {
      if (path2.isJSXAttribute()) {
        const name = path2.get("name");
        const value = path2.get("value");
        if (name.isJSXIdentifier({ name: "href" }) && value.isStringLiteral()) {
          href = value.node.value;
        }
      }
      if (path2.isJSXText()) {
        text = path2.node.value;
      }
    }
  });
  return { href, text };
}
function isRouterNode(path2) {
  return path2.isCallExpression() && path2.get("callee").isMemberExpression() && path2.get("callee.object").find((p) => p.isIdentifier({ name: "router" })) && (path2.get("callee.property").find((p) => p.isIdentifier({ name: "push" })) || path2.get("callee.property").find((p) => p.isIdentifier({ name: "replace" })));
}
function parseRouterArguments(routerPath) {
  routerPath.assertCallExpression();
  const args = routerPath.get("arguments");
  const urlStringOrUrlObject = args[0];
  if (urlStringOrUrlObject.isStringLiteral()) {
    const url = urlStringOrUrlObject.node.value;
    return url;
  }
  return "";
}
function isInJSXElement(routerPath) {
  routerPath.assertCallExpression();
  return routerPath.find((p) => p.isJSXElement());
}
function isInArrowFunctionExpression(routerPath) {
  routerPath.assertCallExpression();
  return routerPath.find((p) => p.isArrowFunctionExpression());
}
function isInFunctionDeclaration(routerPath) {
  routerPath.assertCallExpression();
  return routerPath.find((p) => p.isFunctionDeclaration());
}
function getFunctionName(routerPath) {
  routerPath.assertCallExpression();
  let functionName = "";
  routerPath.find((p) => {
    if (p.isFunctionDeclaration()) {
      functionName = p.node.id?.name;
      return true;
    }
    return false;
  });
  return functionName;
}
function parseInLineJSXRouterNode(routerPath) {
  routerPath.assertCallExpression();
  let handlerName = "";
  routerPath.findParent((p) => {
    if (p.isJSXAttribute()) {
      handlerName = p.node.name.name;
      return false;
    }
    return false;
  });
  return handlerName;
}

// src/ast.ts
import { parse } from "@babel/parser";
import fs from "node:fs";
function getJsxAST(path2) {
  const code = fs.readFileSync(path2, "utf-8");
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });
}

// src/graph.ts
import fs2 from "node:fs";
var Graph = class {
  ajdList;
  constructor() {
    this.ajdList = /* @__PURE__ */ new Map();
  }
  addNode(url) {
    this.ajdList.set(url, []);
  }
  addEdge(startURL, edge) {
    const visitedEdges = this.ajdList.get(startURL) || [];
    visitedEdges.push(edge);
    this.ajdList.set(startURL, visitedEdges);
  }
  isCycle(startURL, edge) {
    const visitedEdges = this.ajdList.get(startURL) || [];
    return visitedEdges.some((visitedEdge) => {
      return visitedEdge.endURL === edge.endURL && visitedEdge.trigger === edge.trigger;
    });
  }
  drawMermaidGraph() {
    let mermaidGraph = "flowchart TB\n";
    this.ajdList.forEach((edges, startURL) => {
      edges.forEach((edge) => {
        mermaidGraph += `${startURL} -->|${edge.trigger}| ${edge.endURL}
`;
      });
    });
    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <script type="module">
          import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
        </script>
      </head>
      <body>
        <pre class="mermaid">
           ${mermaidGraph}
        </pre>
      </body>
    </html>
    `;
    fs2.writeFileSync("graph.html", html);
  }
};
var graph = new Graph();

// src/constants.ts
import path from "node:path";
var APP_PATH_WITHOUT_SRC = path.normalize(
  path.join(process.cwd(), "app")
);
var APP_PATH_WITH_SRC = path.normalize(
  path.join(process.cwd(), "src", "app")
);

// src/index.ts
var traverse = _traverse.default;
var APP_FOLDER_PATH = "";
function start({ entryPagePath }) {
  if (!entryPagePath) {
    if (fs3.existsSync(APP_PATH_WITH_SRC)) {
      entryPagePath = APP_PATH_WITH_SRC;
    } else if (fs3.existsSync(APP_PATH_WITHOUT_SRC)) {
      entryPagePath = APP_PATH_WITHOUT_SRC;
    } else {
      console.error("Can't find entry page file. Use --entry flag to specify");
      return;
    }
  }
  if (!fs3.existsSync(entryPagePath)) {
    console.error("Can't find entry page file");
    return;
  }
  APP_FOLDER_PATH = nodePath.join(entryPagePath.split("app")[0], "app");
  recursive(entryPagePath);
  graph.drawMermaidGraph();
}
function getDynamicRouteFolder(filePath) {
  const paths = filePath.replace("/page.tsx", "").split("/");
  paths.pop();
  const folderPath = [...paths].join("/");
  let dynamicRoute = null;
  fs3.readdirSync(folderPath).forEach((file) => {
    if (file.startsWith("[") && file.endsWith("]")) {
      dynamicRoute = folderPath + "/" + file;
    }
  });
  return dynamicRoute;
}
function recursive(filePath) {
  if (!fs3.existsSync(filePath)) {
    const folderName = getDynamicRouteFolder(filePath);
    if (folderName) {
      filePath = folderName + "/page.tsx";
    } else {
      console.error(filePath, "File does not exist");
      return;
    }
  }
  const ast = getJsxAST(filePath);
  let componentName = "";
  traverse(ast, {
    enter(path2) {
      if (path2.isExportDefaultDeclaration()) {
        path2.traverse({
          enter(childPath) {
            if (childPath.isFunctionDeclaration()) {
              componentName = childPath.node.id.name;
              childPath.stop();
              path2.stop();
            }
          }
        });
      }
    }
  });
  traverse(ast, {
    enter(path2) {
      let nextURL = "";
      let trigger = "";
      if (isRouterNode(path2)) {
        if (isInJSXElement(path2)) {
          if (isInArrowFunctionExpression(path2)) {
            trigger = parseInLineJSXRouterNode(path2);
            nextURL = parseRouterArguments(path2);
          }
        }
        if (!isInJSXElement(path2) && isInFunctionDeclaration(path2)) {
          trigger = getFunctionName(path2);
          nextURL = parseRouterArguments(path2);
        }
      }
      if (isLinkNode(path2)) {
        const linkInfo = parseLinkNode(path2);
        nextURL = linkInfo.href;
        trigger = linkInfo.text;
      }
      if (nextURL && trigger) {
        const startURL = filePath.split("app")[1].replace("/page.tsx", "") || "/";
        if (graph.isCycle(startURL, { startURL, endURL: nextURL, trigger })) {
          return;
        }
        graph.addEdge(startURL, {
          startURL,
          endURL: nextURL,
          trigger
        });
        const nextFilePath = nodePath.join(
          APP_FOLDER_PATH,
          nextURL,
          "page.tsx"
        );
        recursive(nextFilePath);
      }
    }
  });
}
export {
  start
};
