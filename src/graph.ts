import fs from 'node:fs';
import open from 'open';

type Edge = {
  startURL: string;
  endURL: string;
  trigger: string;
};

class Graph {
  ajdList: Map<string, Edge[]>;

  constructor() {
    this.ajdList = new Map();
  }

  addNode(url: string) {
    this.ajdList.set(url, []);
  }

  addEdge(startURL: string, edge: Edge) {
    const visitedEdges = this.ajdList.get(startURL) || [];
    visitedEdges.push(edge);
    this.ajdList.set(startURL, visitedEdges);
  }

  isCycle(startURL: string, edge: Edge) {
    const visitedEdges = this.ajdList.get(startURL) || [];
    return visitedEdges.some(visitedEdge => {
      return visitedEdge.endURL === edge.endURL && visitedEdge.trigger === edge.trigger;
    });
  }

  drawMermaidGraph() {
    let mermaidGraph = 'flowchart TB\n';
    this.ajdList.forEach((edges, startURL) => {
      edges.forEach(edge => {
        mermaidGraph += `${startURL} -->|${edge.trigger}| ${edge.endURL}\n`;
      });
    });

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <script type="module">
          import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
        </script>
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

export const graph = new Graph();
