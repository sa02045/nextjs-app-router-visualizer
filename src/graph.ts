export type Edge = {
  startURL: string;
  endURL: string;
  trigger: string;
};

export class Graph {
  private readonly edges: Map<string, Edge[]> = new Map();

  addEdge(edge: Edge): boolean {
    const existing = this.edges.get(edge.startURL) || [];

    const isDuplicate = existing.some(e => e.endURL === edge.endURL && e.trigger === edge.trigger);
    if (isDuplicate) return false;

    existing.push(edge);
    this.edges.set(edge.startURL, existing);
    return true;
  }

  getEdges(startURL: string): readonly Edge[] {
    return this.edges.get(startURL) || [];
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values()).flat();
  }

  getNodes(): string[] {
    const nodes = new Set<string>();
    for (const [startURL, edges] of this.edges) {
      nodes.add(startURL);
      for (const edge of edges) {
        nodes.add(edge.endURL);
      }
    }
    return Array.from(nodes);
  }

  isEmpty(): boolean {
    return this.edges.size === 0;
  }

  toJSON(): Record<string, Edge[]> {
    const result: Record<string, Edge[]> = {};
    this.edges.forEach((edges, url) => {
      result[url] = edges;
    });
    return result;
  }

  [Symbol.iterator](): Iterator<[string, readonly Edge[]]> {
    return this.edges.entries();
  }
}
