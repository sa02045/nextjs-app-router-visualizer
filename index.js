// src/index.ts
import _traverse from "@babel/traverse";
import fs3 from "node:fs";
import nodePath from "node:path";

// src/nodePath.ts
function isLinkNode(path) {
  return path.isJSXElement() && path.get("openingElement").get("name").isJSXIdentifier({ name: "Link" });
}
function parseLinkNode(linkNodePath) {
  let href = "";
  let text = "";
  linkNodePath.traverse({
    enter(path) {
      if (path.isJSXAttribute()) {
        const name = path.get("name");
        const value = path.get("value");
        if (name.isJSXIdentifier({ name: "href" }) && value.isStringLiteral()) {
          href = value.node.value;
        }
      }
      if (path.isJSXText()) {
        text = path.node.value;
      }
    }
  });
  return { href, text };
}
function isRouterNode(path) {
  return path.isCallExpression() && path.get("callee").isMemberExpression() && path.get("callee.object").find((p) => p.isIdentifier({ name: "router" })) && (path.get("callee.property").find((p) => p.isIdentifier({ name: "push" })) || path.get("callee.property").find((p) => p.isIdentifier({ name: "replace" })));
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
function getJsxAST(path) {
  const code = fs.readFileSync(path, "utf-8");
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

// src/index.ts
var traverse = _traverse.default;
var APP_FOLDER_PATH = "./app";
function start({ entryPagePath }) {
  if (!fs3.existsSync(entryPagePath)) {
    console.error(entryPagePath, "Entry page does not exist");
    return;
  }
  APP_FOLDER_PATH = nodePath.join(entryPagePath.split("app")[0], "app");
  recursive(entryPagePath);
  graph.drawMermaidGraph();
}
function recursive(filePath) {
  if (!fs3.existsSync(filePath)) {
    console.log(filePath, "File does not exist");
    return;
  }
  const ast = getJsxAST(filePath);
  let componentName = "";
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
          }
        });
      }
    }
  });
  traverse(ast, {
    enter(path) {
      let nextURL = "";
      let trigger = "";
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
