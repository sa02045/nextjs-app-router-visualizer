import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
const APP_PATH = "./example/example/app/";

function getAST(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });
}

const ALLOWED_EXTENSIONS = ["tsx", "jsx", "js", "ts"];

const map = new Map();

function isCyclic(key, value) {
  const mapValue = map.get(key);
  if (mapValue && mapValue.path === value) {
    return true;
  }
  return false;
}

function isAllowedFile(fileName) {
  const [name, extension] = fileName.split(".");
  return name === "page" && ALLOWED_EXTENSIONS.includes(extension);
}

const start = async () => {
  const files = fs.readdirSync(APP_PATH);
  files.forEach((file) => {
    if (!isAllowedFile(file)) {
      return;
    }
    const filePath = APP_PATH + file;
    recursiveRouter(filePath);
  });

  let graph = "";

  for (const [key, value] of map) {
    let 출발지 = key;
    let 도착지 = value.path;
    let 이벤트 = value.event;

    graph += `${출발지} --> ${도착지}: ${이벤트}\n`;
  }

  fs.writeFileSync("./graph.d2", graph);
};

function isRouterPush(path) {
  return (
    path.isCallExpression() &&
    path.get("callee").isMemberExpression() &&
    path.get("callee.object").isIdentifier({ name: "router" }) &&
    path.get("callee.property").isIdentifier({ name: "push" })
  );
}

function isLinkComponent(path) {
  return (
    path.isJSXElement() &&
    path.get("openingElement").get("name").isJSXIdentifier({ name: "Link" })
  );
}

function getEvent(path) {
  let event;
  while (path.parentPath) {
    if (path.isJSXElement()) {
      const openingElement = path.get("openingElement");
      const attributes = openingElement.get("attributes");
      const events = attributes.find(
        (attr) =>
          attr.get("name").isJSXIdentifier({ name: "onClick" }) ||
          attr.get("name").isJSXIdentifier({ name: "onBlur" })
      );
      if (events) {
        event = events.get("name").node.name;
      }
    }
    path = path.parentPath;
  }
  return event;
}

function recursiveRouter(currentPath) {
  const currentAST = getAST(currentPath);

  traverse(currentAST, {
    enter(path) {
      if (isRouterPush(path)) {
        const event = getEvent(path);
        const args = path.get("arguments");

        if (args.length === 1) {
          const arg = args[0];
          if (!arg.isStringLiteral()) {
            return;
          }
          const nextPath = arg.node.value;
          const nextFilePath = APP_PATH + nextPath + "/page.tsx";
          const myCurrent = currentPath
            .replace(APP_PATH, "")
            .replace("page.tsx", "");

          if (isCyclic(myCurrent, nextPath)) {
            return;
          }

          map.set(myCurrent || "/", {
            path: nextPath,
            event,
          });

          recursiveRouter(nextFilePath);
        }
      } else if (isLinkComponent(path)) {
        const attributes = path.get("openingElement").get("attributes");
        const href = attributes.find(
          (attr) => attr.get("name").node.name === "href"
        );

        if (!href) {
          return;
        }
        const nextPath = href.get("value").node.value;
        const nextFilePath = APP_PATH + nextPath + "/page.tsx";
        const myCurrent = currentPath
          .replace(APP_PATH, "")
          .replace("page.tsx", "");

        if (isCyclic(myCurrent, nextPath)) {
          return;
        }

        map.set(myCurrent || "/", {
          path: nextPath,
          event,
        });

        recursiveRouter(nextFilePath);
      }
    },
  });
}

start();

export default start;
