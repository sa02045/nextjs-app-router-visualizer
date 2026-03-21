import { describe, it, expect } from 'vitest';
import traverse from '@babel/traverse';
import { isRouterNode, parseRouterArguments } from '../src/node';
import { parseTestCode } from './helpers';

describe('URL extraction', () => {
  it('should extract URL from template literal', () => {
    const ast = parseTestCode(`
      function Product() {
        const router = useRouter();
        const id = "123";
        return <button onClick={() => router.push(\`/products/\${id}\`)}>Go</button>;
      }
    `);

    let url = '';
    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          url = parseRouterArguments(path);
          path.stop();
        }
      },
    });

    expect(url).toBe('/products/[dynamic]');
  });

  it('should resolve simple variable reference', () => {
    const ast = parseTestCode(`
      function Product() {
        const router = useRouter();
        const targetUrl = "/about";
        router.push(targetUrl);
      }
    `);

    let url = '';
    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          url = parseRouterArguments(path);
          path.stop();
        }
      },
    });

    expect(url).toBe('/about');
  });

  it('should return empty string for unresolvable expressions', () => {
    const ast = parseTestCode(`
      function Product() {
        const router = useRouter();
        router.push(getUrl());
      }
    `);

    let url = '';
    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          url = parseRouterArguments(path);
          path.stop();
        }
      },
    });

    expect(url).toBe('');
  });
});
