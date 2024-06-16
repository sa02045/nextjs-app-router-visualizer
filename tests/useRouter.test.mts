import { describe, it, expect } from 'vitest';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import {
  isRouterNode,
  isInArrowFunctionExpression,
  isInFunctionDeclaration,
  isInJSXElement,
  parseInLineJSXRouterNode,
  parseRouterArguments,
  getFunctionName,
} from '../src/nodePath';

describe('router.push()', () => {
  const codeWithRouterPush = `
    import { useRouter } from "next/router";
     function Product() {
        const router = useRouter();
        return (
            <div>
            <button onClick={() => router.push("/about")}>테스트</button>
            </div>
        );
    }
    `;

  const codeWithRouterReplace = `
    import { useRouter } from "next/router";
       export default function Product() {
        const router = useRouter();
        return (
            <div>
            <h1>About Page</h1>
            <button onClick={() => router.replace("/about")}>테스트</button>
            </div>
        );
    }

`;
  const ast = parser.parse(codeWithRouterPush, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  const astWithRouterReplace = parser.parse(codeWithRouterReplace, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  it('should find router.push()', () => {
    let result = false;
    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          result = true;
          path.stop();
        }
      },
    });
    expect(result).toBe(true);
  });

  it('should find router.replace()', () => {
    let result = false;
    traverse(astWithRouterReplace, {
      enter(path) {
        if (isRouterNode(path)) {
          result = true;
          path.stop();
        }
      },
    });
    expect(result).toBe(true);
  });

  it('should find router.push() in JSX inline', () => {
    let handlerNames: string[] = [];
    let urls: string[] = [];
    const ast = parser.parse(
      `
    import { useRouter } from "next/router";
     function Product() {
        const router = useRouter();
        return (
           <div>
                <button onClick={() => router.push("/about")} >테스트</button>
                <button onTest={() => {router.push("/home")}} >테스트</button>
           </div>
        );
    }
    `,
      {
        sourceType: 'module',
        plugins: ['jsx'],
      }
    );

    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          if (isInJSXElement(path)) {
            if (isInArrowFunctionExpression(path)) {
              const handlerName = parseInLineJSXRouterNode(path);
              handlerNames.push(handlerName);
              const url = parseRouterArguments(path);
              urls.push(url);
            }
          }
        }
      },
    });
    expect(handlerNames).toEqual(['onClick', 'onTest']);
    expect(urls).toEqual(['/about', '/home']);
  });

  it('should find router.push() in function declare', () => {
    let handlerNames: string[] = [];
    let urls: string[] = [];
    const ast = parser.parse(
      `
    import { useRouter } from "next/router";
     function Product() {
        const router = useRouter();

        function handleClick() {
            router.push("/about");
        }

        return (
           <div>
                <button onClick={handleClick} >테스트</button>
           </div>
        );
    }
    `,
      {
        sourceType: 'module',
        plugins: ['jsx'],
      }
    );

    traverse(ast, {
      enter(path) {
        if (isRouterNode(path)) {
          if (!isInJSXElement(path)) {
            if (isInFunctionDeclaration(path)) {
              const handlerName = getFunctionName(path);
              handlerNames.push(handlerName);
              const url = parseRouterArguments(path);
              urls.push(url);
            }
          }
        }
      },
    });
    expect(handlerNames).toEqual(['handleClick']);
    expect(urls).toEqual(['/about']);
  });
});
