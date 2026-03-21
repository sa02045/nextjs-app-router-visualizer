import { describe, it, expect } from 'vitest';
import traverse from '@babel/traverse';
import { isNotFoundCall } from '../src/node';
import { parseTestCode } from './helpers';

describe('notFound()', () => {
  it('should detect notFound() call', () => {
    const ast = parseTestCode(`
      import { notFound } from "next/navigation";

      export default function Page({ params }) {
        const data = getData(params.id);
        if (!data) {
          notFound();
        }
        return <div>{data.name}</div>;
      }
    `);

    let found = false;
    traverse(ast, {
      enter(path) {
        if (isNotFoundCall(path)) {
          found = true;
          path.stop();
        }
      },
    });

    expect(found).toBe(true);
  });
});
