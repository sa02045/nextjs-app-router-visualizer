import fs from 'node:fs';
import open from 'open';

export type Edge = {
  startURL: string;
  endURL: string;
  trigger: string;
};

export type OutputFormat = 'html' | 'json';

export class Graph {
  adjList: Map<string, Edge[]>;

  constructor() {
    this.adjList = new Map();
  }

  addNode(url: string) {
    this.adjList.set(url, []);
  }

  addEdge(startURL: string, edge: Edge) {
    const visitedEdges = this.adjList.get(startURL) || [];
    visitedEdges.push(edge);
    this.adjList.set(startURL, visitedEdges);
  }

  isDuplicateEdge(startURL: string, edge: Edge) {
    const visitedEdges = this.adjList.get(startURL) || [];
    return visitedEdges.some(visitedEdge => {
      return visitedEdge.endURL === edge.endURL && visitedEdge.trigger === edge.trigger;
    });
  }

  toJSON() {
    const result: Record<string, Edge[]> = {};
    this.adjList.forEach((edges, url) => {
      result[url] = edges;
    });
    return result;
  }

  drawMermaidGraph(format: OutputFormat = 'html') {
    if (format === 'json') {
      const jsonOutput = JSON.stringify(this.toJSON(), null, 2);
      fs.writeFileSync('graph.json', jsonOutput);
      console.log('Graph written to graph.json');
      return;
    }

    let mermaidGraph = 'flowchart TB\n';
    this.adjList.forEach((edges, startURL) => {
      edges.forEach(edge => {
        const startId = sanitizeMermaidId(edge.startURL);
        const endId = sanitizeMermaidId(edge.endURL);
        const startLabel = edge.startURL;
        const endLabel = edge.endURL;
        const triggerLabel = sanitizeMermaidLabel(edge.trigger);

        // Dynamic routes get a different node shape
        const startNode = isDynamicRoute(startLabel) ? `${startId}{{${quote(startLabel)}}}` : `${startId}[${quote(startLabel)}]`;
        const endNode = isDynamicRoute(endLabel) ? `${endId}{{${quote(endLabel)}}}` : `${endId}[${quote(endLabel)}]`;

        // Different edge styles based on trigger type
        let arrow = '-->';
        if (edge.trigger === 'redirect') arrow = '-..->';
        if (edge.trigger === 'notFound') arrow = '==>';

        mermaidGraph += `${startNode} ${arrow}|${triggerLabel}| ${endNode}\n`;
      });
    });

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Next.js App Router Visualization</title>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; background: #fafafa; }
      .mermaid { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <pre class="mermaid">
${mermaidGraph}
    </pre>
  </body>
</html>
`;

    fs.writeFileSync('graph.html', html);
    open('graph.html');
  }
}

function sanitizeMermaidId(url: string): string {
  return url.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'root';
}

function sanitizeMermaidLabel(text: string): string {
  return text.replace(/"/g, "'").replace(/[|]/g, '/');
}

function quote(text: string): string {
  return `"${text.replace(/"/g, '#quot;')}"`;
}

function isDynamicRoute(url: string): boolean {
  return url.includes('[');
}
