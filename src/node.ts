import { type NodePath } from '@babel/traverse';

// ── Link Component Detection ──

export function isLinkNode(path: NodePath) {
  return path.isJSXElement() && path.get('openingElement').get('name').isJSXIdentifier({ name: 'Link' });
}

export function parseLinkNode(linkNodePath: NodePath) {
  let href = '';
  let text = '';
  let isReplace = false;

  linkNodePath.traverse({
    enter(path) {
      if (path.isJSXAttribute()) {
        const name = path.get('name');
        const value = path.get('value');

        // href="/about" (StringLiteral)
        if (name.isJSXIdentifier({ name: 'href' }) && value.isStringLiteral()) {
          href = value.node.value;
        }

        // href={"/about"} (JSXExpressionContainer wrapping StringLiteral)
        if (name.isJSXIdentifier({ name: 'href' }) && value.isJSXExpressionContainer()) {
          const expr = value.get('expression');
          href = extractURLFromExpression(expr as NodePath);
        }

        // replace prop
        if (name.isJSXIdentifier({ name: 'replace' })) {
          // <Link replace> (no value = true) or <Link replace={true}>
          if (!value.node || (value.isJSXExpressionContainer() && value.get('expression').isBooleanLiteral({ value: true }))) {
            isReplace = true;
          }
        }
      }

      if (path.isJSXText()) {
        const trimmed = path.node.value.trim();
        if (trimmed) text = trimmed;
      }

      // Handle {children} text in JSX expression containers
      if (path.isJSXExpressionContainer()) {
        const expr = path.get('expression');
        if (expr.isStringLiteral()) {
          text = expr.node.value;
        }
      }
    },
  });

  return { href, text, isReplace };
}

// ── Router Detection (useRouter from next/navigation) ──

/**
 * Detects router.push(), router.replace(), router.back(), router.forward()
 * Works with any variable name assigned from useRouter():
 *   const router = useRouter()  →  router.push(...)
 *   const r = useRouter()       →  r.push(...)
 */
export function isRouterMethodCall(path: NodePath) {
  if (!path.isCallExpression()) return false;
  const callee = path.get('callee');
  if (!callee.isMemberExpression()) return false;

  const property = callee.get('property');
  return (
    property.isIdentifier({ name: 'push' }) ||
    property.isIdentifier({ name: 'replace' }) ||
    property.isIdentifier({ name: 'back' }) ||
    property.isIdentifier({ name: 'forward' })
  );
}

export function getRouterMethodName(path: NodePath): string {
  path.assertCallExpression();
  const property = path.get('callee.property');
  if (Array.isArray(property)) return '';
  return property.isIdentifier() ? property.node.name : '';
}

// Legacy compat — narrower check used by existing code
export function isRouterNode(path: NodePath) {
  if (!isRouterMethodCall(path)) return false;
  const method = getRouterMethodName(path);
  return method === 'push' || method === 'replace';
}

export function parseRouterArguments(routerPath: NodePath) {
  routerPath.assertCallExpression();
  const args = routerPath.get('arguments');
  const firstArg = args[0];
  return extractURLFromExpression(firstArg);
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
      functionName = p.node.id?.name ?? '';
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
      return true;
    }
    return false;
  });

  return handlerName;
}

// ── redirect() / permanentRedirect() Detection ──

export function isRedirectCall(path: NodePath) {
  return path.isCallExpression() && path.get('callee').isIdentifier({ name: 'redirect' });
}

export function isPermanentRedirectCall(path: NodePath) {
  return path.isCallExpression() && path.get('callee').isIdentifier({ name: 'permanentRedirect' });
}

export function parseRedirectArguments(path: NodePath): string {
  path.assertCallExpression();
  const args = path.get('arguments');
  const firstArg = args[0];
  return extractURLFromExpression(firstArg);
}

// ── notFound() Detection ──

export function isNotFoundCall(path: NodePath) {
  return path.isCallExpression() && path.get('callee').isIdentifier({ name: 'notFound' });
}

// ── History API Detection ──

/**
 * Detects window.history.pushState(state, title, url) and
 * window.history.replaceState(state, title, url)
 */
export function isHistoryStateCall(path: NodePath) {
  if (!path.isCallExpression()) return false;
  const callee = path.get('callee');
  if (!callee.isMemberExpression()) return false;

  const property = callee.get('property');
  if (!property.isIdentifier({ name: 'pushState' }) && !property.isIdentifier({ name: 'replaceState' })) {
    return false;
  }

  // Check for history.pushState or window.history.pushState
  const object = callee.get('object');
  if (object.isIdentifier({ name: 'history' })) return true;
  if (
    object.isMemberExpression() &&
    object.get('object').isIdentifier({ name: 'window' }) &&
    object.get('property').isIdentifier({ name: 'history' })
  ) {
    return true;
  }

  return false;
}

export function getHistoryMethodName(path: NodePath): string {
  path.assertCallExpression();
  const property = path.get('callee.property');
  if (Array.isArray(property)) return '';
  return property.isIdentifier() ? property.node.name : '';
}

export function parseHistoryStateURL(path: NodePath): string {
  path.assertCallExpression();
  // history.pushState(state, title, url) — URL is the 3rd argument
  const args = path.get('arguments');
  const urlArg = args[2];
  if (!urlArg) return '';
  return extractURLFromExpression(urlArg);
}

// ── URL Extraction Utilities ──

export function extractURLFromExpression(exprPath: NodePath): string {
  if (!exprPath) return '';

  // String literal: "/about"
  if (exprPath.isStringLiteral()) {
    return exprPath.node.value;
  }

  // Template literal: `/products/${id}` → "/products/[dynamic]"
  if (exprPath.isTemplateLiteral()) {
    const quasis = exprPath.node.quasis;
    const parts: string[] = [];
    for (let i = 0; i < quasis.length; i++) {
      parts.push(quasis[i].value.cooked ?? quasis[i].value.raw);
      if (i < quasis.length - 1) {
        parts.push('[dynamic]');
      }
    }
    return parts.join('');
  }

  // Variable reference: resolve simple const assignments
  if (exprPath.isIdentifier()) {
    const binding = exprPath.scope.getBinding(exprPath.node.name);
    if (binding) {
      const initPath = binding.path.get('init');
      if (!Array.isArray(initPath) && initPath.isStringLiteral()) {
        return initPath.node.value;
      }
    }
  }

  return '';
}
