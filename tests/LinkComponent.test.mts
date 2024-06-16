import { describe, it, expect } from 'vitest';
import parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';

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

  const ast = parser.parse(codeWithLinkComponent, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

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
    const astWithoutLinkComponent = parser.parse(codeWithoutLinkComponent, {
      sourceType: 'module',
      plugins: ['jsx'],
    });
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
    expect(linkInfo).toEqual({ href: '/about', text: '테스트' });
  });
});

function isLinkNode(path: NodePath) {
  return path.isJSXElement() && path.get('openingElement').get('name').isJSXIdentifier({ name: 'Link' });
}

function parseLinkNode(linkNode: NodePath) {
  let href = '';
  let text = '';

  linkNode.traverse({
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
