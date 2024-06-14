// index.ts
import _traverse from "@babel/traverse";
import fs3 from "node:fs";
import nodePath from "node:path";

// validNodePath.ts
function hasRouterPushJsxAttributeValue(path) {
  let result = false;
  let trigger = "";
  if (path.isJSXAttribute()) {
    const key = path.get("name");
    const value = path.get("value");
    if (key.isJSXIdentifier() && key.node.name.startsWith("on")) {
      trigger = key.node.name;
      value.traverse({
        enter(childPath) {
          if (hasRouterPush(childPath)) {
            result = true;
          }
        }
      });
    }
  }
  return {
    result,
    trigger
  };
}
function hasRouterPush(path) {
  if (path.isCallExpression() && path.get("callee").isMemberExpression() && path.get("callee.object").find((p) => p.isIdentifier({ name: "router" })) && (path.get("callee.property").find((p) => p.isIdentifier({ name: "push" })) || path.get("callee.property").find((p) => p.isIdentifier({ name: "replace" })))) {
    return true;
  }
  return false;
}
function getPathName(routerPath) {
  if (!routerPath.isCallExpression()) {
    return "";
  }
  const args = routerPath.get("arguments");
  const urlStringOrUrlObject = args[0];
  if (urlStringOrUrlObject.isStringLiteral()) {
    const url = urlStringOrUrlObject.node.value;
    return url;
  }
  if (urlStringOrUrlObject.isObjectExpression()) {
    const urlObject = urlStringOrUrlObject;
    const properties = urlObject.get("properties");
    properties.forEach((property) => {
      if (property.isObjectProperty() && property.get("key").isIdentifier({ name: "pathname" })) {
        const value = property.get("value");
        if (value.isStringLiteral()) {
          const url = value.node.value;
          return url;
        }
      }
    });
  }
  return "";
}

// ast.ts
import { parse } from "@babel/parser";
import fs from "node:fs";
function getJsxAST(path) {
  const code = fs.readFileSync(path, "utf-8");
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });
}

// graph.ts
import fs2 from "node:fs";
import prettier from "prettier";
var Graph = /* @__PURE__ */ new Map();
function isCyclic(startURL, endURL) {
  const visited = Graph.get(startURL) || [];
  return visited.some((v) => v.endURL === endURL);
}
function addGraph(startURL, endURL, trigger) {
  const visited = Graph.get(startURL) || [];
  visited.push({ endURL, trigger });
  Graph.set(startURL, visited);
}
function drawMermaidGraph() {
  let graph = "flowchart TB\n";
  Graph.forEach((value, startURL) => {
    value.forEach((v) => {
      graph += `${startURL} -->|${v.trigger}| ${v.endURL}
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
       ${graph}
    </pre>
  </body>
</html>
`;
  prettier.format(html, { parser: "html" }).then((formatHTML) => {
    fs2.writeFileSync("graph.html", formatHTML);
  });
}

// index.ts
var traverse = _traverse.default;
var APP_FOLDER_PATH = "";
function start({ entryPagePath }) {
  const entry = entryPagePath;
  if (!fs3.existsSync(entry)) {
    console.error(entry, "Entry page does not exist");
    return;
  }
  APP_FOLDER_PATH = entry.replace("/page.tsx", "");
  recursive(entry);
  drawMermaidGraph();
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
      if (path.isJSXOpeningElement()) {
        path.traverse({
          enter(childPath) {
            const { result, trigger: _trigger } = hasRouterPushJsxAttributeValue(childPath);
            if (result) {
              trigger = _trigger;
            }
            if (hasRouterPush(childPath)) {
              nextURL = getPathName(childPath);
            }
          }
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
          }
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
                if (name.isJSXIdentifier({ name: "href" }) && value.isStringLiteral()) {
                  nextURL = value.node.value;
                }
              }
            }
          });
        }
      }
      if (nextURL && trigger) {
        const startURL = filePath.replace(APP_FOLDER_PATH, "").replace("/page.tsx", "") || "/";
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
    }
  });
}
export {
  start
};
