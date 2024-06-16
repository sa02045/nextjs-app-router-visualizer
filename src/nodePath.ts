import { type NodePath } from '@babel/traverse';

export function isLinkNode(path: NodePath) {
  return path.isJSXElement() && path.get('openingElement').get('name').isJSXIdentifier({ name: 'Link' });
}

export function parseLinkNode(linkNodePath: NodePath) {
  let href = '';
  let text = '';

  linkNodePath.traverse({
    enter(path) {
      if (path.isJSXAttribute()) {
        const name = path.get('name');
        const value = path.get('value');
        if (name.isJSXIdentifier({ name: 'href' }) && value.isStringLiteral()) {
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

export function isRouterNode(path: NodePath) {
  return (
    path.isCallExpression() &&
    path.get('callee').isMemberExpression() &&
    path.get('callee.object').find(p => p.isIdentifier({ name: 'router' })) &&
    (path.get('callee.property').find(p => p.isIdentifier({ name: 'push' })) ||
      path.get('callee.property').find(p => p.isIdentifier({ name: 'replace' })))
  );
}

export function parseRouterArguments(routerPath: NodePath) {
  routerPath.assertCallExpression();
  const args = routerPath.get('arguments');
  const urlStringOrUrlObject = args[0];
  if (urlStringOrUrlObject.isStringLiteral()) {
    const url = urlStringOrUrlObject.node.value;
    return url;
  }
  return '';
}

export function isInJSXElement(routerPath: NodePath) {
  routerPath.assertCallExpression();
  return routerPath.find(p => p.isJSXElement());
}

export function isInArrowFunctionExpression(routerPath: NodePath) {
  routerPath.assertCallExpression();
  return routerPath.find(p => p.isArrowFunctionExpression());
}

export function isInFunctionDeclaration(routerPath: NodePath) {
  routerPath.assertCallExpression();
  return routerPath.find(p => p.isFunctionDeclaration());
}

export function getFunctionName(routerPath: NodePath) {
  routerPath.assertCallExpression();

  let functionName = '';

  routerPath.find(p => {
    if (p.isFunctionDeclaration()) {
      functionName = p.node.id?.name as string;
      return true;
    }
    return false;
  });

  return functionName;
}

export function parseInLineJSXRouterNode(routerPath: NodePath) {
  routerPath.assertCallExpression();

  let handlerName: string = '';

  routerPath.findParent(p => {
    if (p.isJSXAttribute()) {
      handlerName = p.node.name.name as string;
      return false;
    }
    return false;
  });

  return handlerName;
}
