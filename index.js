import fs from "node:fs";
import { parse } from "@babel/parser";

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
  const files = fs.readdirSync("./app");
  files.forEach((file) => {
    if (!isAllowedFile(file)) {
      return;
    }
    const filePath = `./app/${file}`;
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

function recursiveRouter(path) {
  const ast = getAST(path);

  traverse(ast, {
    enter(path) {
      if (isRouterPush(path)) {
        const args = path.get("arguments");
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

        if (args.length === 1) {
          const arg = args[0];
          if (arg.isStringLiteral()) {
            const nextPath = arg.node.value;
            const nextFilePath = "./app" + nextPath + "/page.tsx";
            const currentPath = path
              .replace("./app", "")
              .replace("/page.tsx", "");

            if (isCyclic(currentPath, nextPath)) {
              return;
            }

            if (currentPath === "") {
              map.set("entry", {
                path: nextPath,
                event,
              });
            } else {
              map.set(currentPath, {
                path: nextPath,
                event,
              });
            }

            recursiveRouter(nextFilePath);
          }
        }
      }
    },
  });
}

export default start;
