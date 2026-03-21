import { describe, it, expect } from 'vitest';
import traverse from '@babel/traverse';
import { isLinkNode, parseLinkNode } from '../src/node';
import { parseTestCode } from './helpers';

describe('LinkComponent', () => {
  const codeWithLinkComponent = `
    import Link from "next/link";

    export default function Product() {
        return (
            <div>
            <h1>About Page</h1>
            <Link href="/about">테스트</Link>
            </div>
        );
    }
    `;

  const codeWithoutLinkComponent = `
    import Link from "next/link";

    export default function Product() {
        return (
            <div>
            <h1>About Page</h1>
            </div>
        );
    }
    `;

  const ast = parseTestCode(codeWithLinkComponent);

  it('should find Link component', () => {
    let result = false;
    traverse(ast, {
      enter(path) {
        if (isLinkNode(path)) {
          result = true;
          path.stop();
        }
      },
    });
    expect(result).toBe(true);
  });

  it('should not find Link component', () => {
    let result = false;
    const astWithoutLinkComponent = parseTestCode(codeWithoutLinkComponent);
    traverse(astWithoutLinkComponent, {
      enter(path) {
        if (isLinkNode(path)) {
          result = true;
          path.stop();
        }
      },
    });
    expect(result).toBe(false);
  });

  it('should parse Link component info', () => {
    let linkInfo = {};
    traverse(ast, {
      enter(path) {
        if (isLinkNode(path)) {
          linkInfo = parseLinkNode(path);
          path.stop();
        }
      },
    });
    expect(linkInfo).toEqual({ href: '/about', text: '테스트', isReplace: false });
  });
});
