import _traverse, { type NodePath } from "@babel/traverse";

// @ts-ignore
const traverse = _traverse?.default as typeof _traverse;

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

export function isJsxArrowFunctionRouterPush(path: NodePath) {
  let result = false;
  if (path.isJSXOpeningElement()) {
    path.traverse({
      enter(childPath) {
        if (hasRouterPush(childPath)) {
          result = true;
        }
      },
    });
  }
  return result;
}

function isFunctionDeclarationRouterPush(path: NodePath) {
  if (path.isFunctionDeclaration()) {
    const blockStatement = path.get("body");
    blockStatement.traverse({
      enter(path) {
        if (hasRouterPush(path)) {
          return true;
        }
      },
    });
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

export function getJsxArrowFunctionTrigger(path: NodePath) {
  path.assertJSXOpeningElement();
  let trigger = "";

  const attributes = path.get("attributes");

  attributes.forEach((attribute) => {
    if (attribute.isJSXAttribute()) {
      const value = attribute.get("value");
      console.log(value);
    }
  });
  return trigger;
}

export function getTrigger(routerPath: NodePath, componentName: string) {
  if (!routerPath.isCallExpression()) {
    return "";
  }

  let trigger = "";

  routerPath.findParent((parentPath) => {
    if (parentPath.isFunctionDeclaration()) {
      parentPath.traverse({
        enter(childPath) {
          if (hasRouterPush(childPath)) {
            if (componentName !== parentPath.node.id?.name) {
              trigger = parentPath.node.id?.name;
            }
          }
        },
      });
      return true;
    }
    return false;
  });

  return trigger;
}

export function isArrowFunctionRouterPush(path: NodePath) {
  let result = false;
  let trigger = "";
  let nextPath = "";

  if (path.isArrowFunctionExpression()) {
    const blockStatement = path.get("body");
    blockStatement.traverse({
      enter(path) {
        if (
          path.isCallExpression() &&
          path.get("callee").isMemberExpression() &&
          path
            .get("callee.object")
            .find((p) => p.isIdentifier({ name: "router" })) &&
          path
            .get("callee.property")
            .find((p) => p.isIdentifier({ name: "push" }))
        ) {
          result = true;

          const pushArguments = path.get("arguments");
          const nextPathArg = pushArguments.find((arg) => {
            if (arg.isStringLiteral() && arg?.node.value) {
              return true;
            }
            return false;
          });

          if (nextPathArg?.isStringLiteral()) {
            nextPath = nextPathArg.node.value;
          }

          const handler = findHandlerNameTraverseParent(path);
          if (handler) {
            trigger = handler;
          }
        }
      },
    });
  }
  return {
    result,
    nextPath,
    trigger,
  };
}

function findHandlerNameTraverseParent(path: NodePath) {
  let handlerName = "";
  path.findParent((p) => {
    if (p.isJSXIdentifier() && p.node.name.startsWith("on")) {
      handlerName = p.node.name;
      return true;
    }
    return false;
  });
  return handlerName;
}

export function isLinkComponent(path: NodePath) {
  return (
    path.isJSXElement() &&
    path.get("openingElement").get("name").isJSXIdentifier({ name: "Link" })
  );
}
