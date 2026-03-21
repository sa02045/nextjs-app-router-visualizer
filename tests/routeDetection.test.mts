import { describe, it, expect } from 'vitest';
import traverse from '@babel/traverse';
import {
  isLinkNode,
  parseLinkNode,
  isRouterMethodCall,
  getRouterMethodName,
  parseRouterArguments,
  isPermanentRedirectCall,
  parseRedirectArguments,
  isHistoryStateCall,
  getHistoryMethodName,
  parseHistoryStateURL,
} from '../src/node';
import { parseTestCode } from './helpers';

describe('Link component', () => {
  it('should parse href from JSXExpressionContainer', () => {
    const ast = parseTestCode(`
      import Link from "next/link";
      export default function Page() {
        return <Link href={"/about"}>Go</Link>;
      }
    `);

    let href = '';
    traverse(ast, {
      enter(path) {
        if (isLinkNode(path)) {
          href = parseLinkNode(path).href;
          path.stop();
        }
      },
    });
    expect(href).toBe('/about');
  });

  it('should detect replace prop', () => {
    const ast = parseTestCode(`
      import Link from "next/link";
      export default function Page() {
        return <Link href="/about" replace>Go</Link>;
      }
    `);

    let isReplace = false;
    traverse(ast, {
      enter(path) {
        if (isLinkNode(path)) {
          isReplace = parseLinkNode(path).isReplace;
          path.stop();
        }
      },
    });
    expect(isReplace).toBe(true);
  });

  it('should handle template literal href in expression container', () => {
    const ast = parseTestCode(`
      import Link from "next/link";
      export default function Page() {
        const id = "123";
        return <Link href={\`/products/\${id}\`}>Go</Link>;
      }
    `);

    let href = '';
    traverse(ast, {
      enter(path) {
        if (isLinkNode(path)) {
          href = parseLinkNode(path).href;
          path.stop();
        }
      },
    });
    expect(href).toBe('/products/[dynamic]');
  });
});

describe('permanentRedirect()', () => {
  it('should detect permanentRedirect() call', () => {
    const ast = parseTestCode(`
      import { permanentRedirect } from "next/navigation";
      export default function Page() {
        permanentRedirect("/new-page");
      }
    `);

    let found = false;
    let url = '';
    traverse(ast, {
      enter(path) {
        if (isPermanentRedirectCall(path)) {
          found = true;
          url = parseRedirectArguments(path);
          path.stop();
        }
      },
    });
    expect(found).toBe(true);
    expect(url).toBe('/new-page');
  });
});

describe('router.back() and router.forward()', () => {
  it('should detect router.back()', () => {
    const ast = parseTestCode(`
      import { useRouter } from "next/navigation";
      function Page() {
        const router = useRouter();
        return <button onClick={() => router.back()}>뒤로</button>;
      }
    `);

    let method = '';
    traverse(ast, {
      enter(path) {
        if (isRouterMethodCall(path)) {
          method = getRouterMethodName(path);
          path.stop();
        }
      },
    });
    expect(method).toBe('back');
  });

  it('should detect router.forward()', () => {
    const ast = parseTestCode(`
      import { useRouter } from "next/navigation";
      function Page() {
        const router = useRouter();
        return <button onClick={() => router.forward()}>앞으로</button>;
      }
    `);

    let method = '';
    traverse(ast, {
      enter(path) {
        if (isRouterMethodCall(path)) {
          method = getRouterMethodName(path);
          path.stop();
        }
      },
    });
    expect(method).toBe('forward');
  });
});

describe('router with different variable names', () => {
  it('should detect r.push() when useRouter is assigned to r', () => {
    const ast = parseTestCode(`
      import { useRouter } from "next/navigation";
      function Page() {
        const r = useRouter();
        return <button onClick={() => r.push("/about")}>Go</button>;
      }
    `);

    let found = false;
    let url = '';
    traverse(ast, {
      enter(path) {
        if (isRouterMethodCall(path) && getRouterMethodName(path) === 'push') {
          found = true;
          url = parseRouterArguments(path);
          path.stop();
        }
      },
    });
    expect(found).toBe(true);
    expect(url).toBe('/about');
  });
});

describe('History API', () => {
  it('should detect window.history.pushState()', () => {
    const ast = parseTestCode(`
      function Page() {
        function handleClick() {
          window.history.pushState(null, "", "/about");
        }
        return <button onClick={handleClick}>Go</button>;
      }
    `);

    let found = false;
    let method = '';
    let url = '';
    traverse(ast, {
      enter(path) {
        if (isHistoryStateCall(path)) {
          found = true;
          method = getHistoryMethodName(path);
          url = parseHistoryStateURL(path);
          path.stop();
        }
      },
    });
    expect(found).toBe(true);
    expect(method).toBe('pushState');
    expect(url).toBe('/about');
  });

  it('should detect history.replaceState()', () => {
    const ast = parseTestCode(`
      function Page() {
        history.replaceState(null, "", "/new-path");
      }
    `);

    let found = false;
    let method = '';
    let url = '';
    traverse(ast, {
      enter(path) {
        if (isHistoryStateCall(path)) {
          found = true;
          method = getHistoryMethodName(path);
          url = parseHistoryStateURL(path);
          path.stop();
        }
      },
    });
    expect(found).toBe(true);
    expect(method).toBe('replaceState');
    expect(url).toBe('/new-path');
  });

  it('should not detect unrelated pushState calls', () => {
    const ast = parseTestCode(`
      function Page() {
        someObj.pushState(null, "", "/about");
      }
    `);

    let found = false;
    traverse(ast, {
      enter(path) {
        if (isHistoryStateCall(path)) {
          found = true;
        }
      },
    });
    expect(found).toBe(false);
  });
});
