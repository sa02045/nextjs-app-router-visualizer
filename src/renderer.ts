import fs from 'node:fs';
import open from 'open';
import type { Graph, Edge } from './graph.js';

export type OutputFormat = 'html' | 'json';

export function renderGraph(graph: Graph, outputPath: string, format: OutputFormat) {
  if (format === 'json') {
    renderJSON(graph, outputPath);
  } else {
    renderMermaidHTML(graph, outputPath);
  }
}

function renderJSON(graph: Graph, outputPath: string) {
  fs.writeFileSync(outputPath, JSON.stringify(graph.toJSON(), null, 2));
}

function renderMermaidHTML(graph: Graph, outputPath: string) {
  const mermaidSyntax = toMermaidSyntax(graph);

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Next.js App Router Visualization</title>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({
        startOnLoad: true,
        theme: 'base',
        themeVariables: {
          primaryColor: '#e8f4fd',
          primaryBorderColor: '#4a90d9',
          primaryTextColor: '#1a1a1a',
          lineColor: '#666',
          fontSize: '14px',
        },
        flowchart: {
          curve: 'basis',
          padding: 16,
          nodeSpacing: 30,
          rankSpacing: 50,
          htmlLabels: true,
        },
      });
    </script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: #f5f5f5;
        padding: 24px;
        color: #333;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      h1 { font-size: 1.125rem; font-weight: 600; }
      .legend {
        display: flex;
        gap: 16px;
        font-size: 0.75rem;
        color: #666;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .legend-line {
        width: 24px;
        height: 2px;
      }
      .legend-line.solid { background: #666; }
      .legend-line.dashed { background: repeating-linear-gradient(90deg, #666 0 4px, transparent 4px 8px); }
      .legend-line.thick { background: #666; height: 3px; }
      .legend-line.dotted { background: repeating-linear-gradient(90deg, #666 0 2px, transparent 2px 6px); }
      .graph-container {
        background: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Next.js App Router - Page Flow</h1>
      <div class="legend">
        <div class="legend-item"><span class="legend-line solid"></span> navigate</div>
        <div class="legend-item"><span class="legend-line dashed"></span> redirect / replace</div>
        <div class="legend-item"><span class="legend-line thick"></span> notFound</div>
        <div class="legend-item"><span class="legend-line dotted"></span> history API</div>
      </div>
    </header>
    <div class="graph-container">
      <pre class="mermaid">
${mermaidSyntax}
      </pre>
    </div>
  </body>
</html>
`;

  fs.writeFileSync(outputPath, html);
  open(outputPath);
}

// --- Mermaid syntax generation ---

function toMermaidSyntax(graph: Graph): string {
  const lines: string[] = ['flowchart TB'];

  // 1. Declare all nodes once with their shapes
  const declaredNodes = new Set<string>();
  for (const [startURL, edges] of graph) {
    declareNode(startURL, lines, declaredNodes);
    for (const edge of edges) {
      declareNode(edge.endURL, lines, declaredNodes);
    }
  }

  lines.push('');

  // 2. Subgraphs for shared route prefixes
  const subgraphs = buildSubgraphs(graph);
  for (const [prefix, nodeIds] of subgraphs) {
    if (nodeIds.length < 2) continue;
    lines.push(`subgraph ${nodeId('sg_' + prefix)}["${prefix}"]`);
    lines.push('direction TB');
    for (const nodeId of nodeIds) {
      lines.push(nodeId);
    }
    lines.push('end');
  }

  if (subgraphs.size > 0) lines.push('');

  // 3. Edges
  for (const [, edges] of graph) {
    for (const edge of edges) {
      const startId = nodeId(edge.startURL);
      const endId = nodeId(edge.endURL);
      const arrow = mermaidArrow(edge);
      const label = sanitizeLabel(edge.trigger);

      lines.push(`${startId} ${arrow}|${label}| ${endId}`);
    }
  }

  lines.push('');

  // 4. Style classes
  lines.push('classDef special fill:#fff3e0,stroke:#f57c00,stroke-width:2px');
  lines.push('classDef error fill:#fce4ec,stroke:#e53935,stroke-width:2px');

  // Apply classes
  for (const node of declaredNodes) {
    if (node === '/404') {
      lines.push(`class ${nodeId(node)} error`);
    } else if (node.startsWith('[')) {
      lines.push(`class ${nodeId(node)} special`);
    }
  }

  return lines.join('\n');
}

function declareNode(url: string, lines: string[], declared: Set<string>) {
  if (declared.has(url)) return;
  declared.add(url);

  const id = nodeId(url);
  const label = quote(url);

  if (url === '/404') {
    lines.push(`${id}(((${label})))`);
  } else if (url.startsWith('[')) {
    lines.push(`${id}{{${label}}}`);
  } else if (url === '/') {
    lines.push(`${id}([${label}])`);
  } else {
    lines.push(`${id}[${label}]`);
  }
}

/**
 * Group nodes by their first non-root path segment.
 * e.g. /checkout/payment, /checkout/confirm → "checkout" group
 */
function buildSubgraphs(graph: Graph): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const allURLs = new Set<string>();

  for (const [startURL, edges] of graph) {
    allURLs.add(startURL);
    for (const edge of edges) {
      allURLs.add(edge.endURL);
    }
  }

  for (const url of allURLs) {
    // Skip special nodes and root
    if (url.startsWith('[') || url === '/' || url === '/404') continue;

    const segments = url.split('/').filter(Boolean);
    if (segments.length < 2) continue;

    const prefix = '/' + segments[0];
    const group = groups.get(prefix) || [];
    group.push(nodeId(url));
    groups.set(prefix, group);
  }

  return groups;
}

function nodeId(url: string): string {
  if (url === '/') return 'page_root';
  return 'page_' + url.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');
}

function mermaidArrow(edge: Edge): string {
  const { trigger } = edge;

  if (trigger === 'redirect' || trigger === 'permanentRedirect') return '-..->';
  if (trigger === 'notFound') return '==>';
  if (trigger.startsWith('history.')) return '-.->';
  if (trigger.includes('(replace)') || trigger === 'router.replace') return '-..->';
  return '-->';
}

function sanitizeLabel(text: string): string {
  return text.replace(/"/g, "'").replace(/[|]/g, '/');
}

function quote(text: string): string {
  return `"${text.replace(/"/g, '#quot;')}"`;
}
