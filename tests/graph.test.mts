import { describe, it, expect } from 'vitest';
import { Graph } from '../src/graph';

describe('Graph', () => {
  it('should add edges and retrieve them', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'click' });

    expect(graph.getEdges('/')).toEqual([{ startURL: '/', endURL: '/about', trigger: 'click' }]);
    expect(graph.getEdges('/nonexistent')).toEqual([]);
  });

  it('should reject duplicate edges and return false', () => {
    const graph = new Graph();
    const edge = { startURL: '/', endURL: '/about', trigger: 'click' };

    expect(graph.addEdge(edge)).toBe(true);
    expect(graph.addEdge(edge)).toBe(false);
    expect(graph.getEdges('/').length).toBe(1);
  });

  it('should allow edges with same URL but different triggers', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'click' });
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'redirect' });

    expect(graph.getEdges('/').length).toBe(2);
  });

  it('should collect all unique nodes', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'link' });
    graph.addEdge({ startURL: '/', endURL: '/products', trigger: 'link' });
    graph.addEdge({ startURL: '/products', endURL: '/products/detail', trigger: 'link' });

    const nodes = graph.getNodes().sort();
    expect(nodes).toEqual(['/', '/about', '/products', '/products/detail']);
  });

  it('should report isEmpty correctly', () => {
    const graph = new Graph();
    expect(graph.isEmpty()).toBe(true);

    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'link' });
    expect(graph.isEmpty()).toBe(false);
  });

  it('should return all edges via getAllEdges', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/a', trigger: '1' });
    graph.addEdge({ startURL: '/', endURL: '/b', trigger: '2' });
    graph.addEdge({ startURL: '/a', endURL: '/c', trigger: '3' });

    expect(graph.getAllEdges().length).toBe(3);
  });

  it('should serialize to JSON', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'link' });

    const json = graph.toJSON();
    expect(json).toEqual({
      '/': [{ startURL: '/', endURL: '/about', trigger: 'link' }],
    });
  });

  it('should be iterable', () => {
    const graph = new Graph();
    graph.addEdge({ startURL: '/', endURL: '/about', trigger: 'link' });
    graph.addEdge({ startURL: '/about', endURL: '/', trigger: 'back' });

    const entries = [...graph];
    expect(entries.length).toBe(2);
    expect(entries[0][0]).toBe('/');
    expect(entries[1][0]).toBe('/about');
  });
});
