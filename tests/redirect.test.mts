import { describe, it, expect } from 'vitest';
import traverse from '@babel/traverse';
import { isRedirectCall, parseRedirectArguments } from '../src/node';
import { parseTestCode } from './helpers';

describe('redirect()', () => {
  it('should detect redirect() call', () => {
    const ast = parseTestCode(`
      import { redirect } from "next/navigation";

      export default function Page() {
        redirect("/login");
      }
    `);

    let found = false;
    let url = '';
    traverse(ast, {
      enter(path) {
        if (isRedirectCall(path)) {
          found = true;
          url = parseRedirectArguments(path);
          path.stop();
        }
      },
    });

    expect(found).toBe(true);
    expect(url).toBe('/login');
  });

  it('should not match non-redirect calls', () => {
    const ast = parseTestCode(`
      function someOther() {}
      someOther("/test");
    `);

    let found = false;
    traverse(ast, {
      enter(path) {
        if (isRedirectCall(path)) {
          found = true;
        }
      },
    });

    expect(found).toBe(false);
  });
});
