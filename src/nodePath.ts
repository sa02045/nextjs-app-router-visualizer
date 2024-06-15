import { type NodePath } from "@babel/traverse";

export function hasRouterPushJsxAttributeValue(path: NodePath) {
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
        },
      });
    }
  }
  return {
    result,
    trigger,
  };
}

export function hasRouterPush(path: NodePath) {
  if (
    path.isCallExpression() &&
    path.get("callee").isMemberExpression() &&
    path.get("callee.object").find((p) => p.isIdentifier({ name: "router" })) &&
    (path
      .get("callee.property")
      .find((p) => p.isIdentifier({ name: "push" })) ||
      path
        .get("callee.property")
        .find((p) => p.isIdentifier({ name: "replace" })))
  ) {
    return true;
  }
  return false;
}

export function getPathName(routerPath: NodePath) {
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
      if (
        property.isObjectProperty() &&
        property.get("key").isIdentifier({ name: "pathname" })
      ) {
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

export function isLinkNode(path: NodePath) {
  return (
    path.isJSXElement() &&
    path.get("openingElement").get("name").isJSXIdentifier({ name: "Link" })
  );
}

export function parseLinkNode(linkNodePath: NodePath) {
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
    },
  });

  return { href, text };
}
