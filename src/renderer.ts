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
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; background: #fafafa; }
      h1 { font-size: 1.25rem; color: #333; margin-bottom: 1rem; }
      .mermaid { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <h1>Next.js App Router - Page Flow</h1>
    <pre class="mermaid">
${mermaidSyntax}
    </pre>
  </body>
</html>
`;

  fs.writeFileSync(outputPath, html);
  open(outputPath);
}

function toMermaidSyntax(graph: Graph): string {
  let syntax = 'flowchart TB\n';

  for (const [, edges] of graph) {
    for (const edge of edges) {
      const startNode = mermaidNode(edge.startURL);
      const endNode = mermaidNode(edge.endURL);
      const arrow = mermaidArrow(edge);
      const label = sanitizeLabel(edge.trigger);

      syntax += `${startNode} ${arrow}|${label}| ${endNode}\n`;
    }
  }

  return syntax;
}

function mermaidNode(url: string): string {
  const id = sanitizeId(url);
  const label = quote(url);

  // Special nodes get distinct shapes
  if (url === '/404') return `${id}(((${label})))`;
  if (url.startsWith('[')) return `${id}{{${label}}}`;
  return `${id}[${label}]`;
}

function mermaidArrow(edge: Edge): string {
  const { trigger } = edge;

  // Server redirects: dotted line
  if (trigger === 'redirect' || trigger === 'permanentRedirect') return '-..->';
  // notFound: thick line
  if (trigger === 'notFound') return '==>';
  // History API: dash-dot
  if (trigger.startsWith('history.')) return '-.->';
  // replace navigation: dashed
  if (trigger.includes('(replace)') || trigger === 'router.replace') return '-..->';
  // Default: solid
  return '-->';
}

function sanitizeId(url: string): string {
  return url.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'root';
}

function sanitizeLabel(text: string): string {
  return text.replace(/"/g, "'").replace(/[|]/g, '/');
}

function quote(text: string): string {
  return `"${text.replace(/"/g, '#quot;')}"`;
}
