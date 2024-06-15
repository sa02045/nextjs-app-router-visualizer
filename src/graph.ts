import fs from "node:fs";
import prettier from "prettier";
type Node = {
  endURL: string;
  trigger: string;
};

type StartURL = string;

const Graph = new Map<StartURL, Node[]>();

export function isCyclic(startURL: string, endURL: string) {
  const visited = Graph.get(startURL) || [];
  return visited.some((v) => v.endURL === endURL);
}

export function addGraph(startURL: string, endURL: string, trigger: string) {
  const visited = Graph.get(startURL) || [];
  visited.push({ endURL, trigger });
  Graph.set(startURL, visited);
}

export function drawMermaidGraph() {
  let graph = "flowchart TB\n";
  Graph.forEach((value, startURL) => {
    value.forEach((v) => {
      graph += `${startURL} -->|${v.trigger}| ${v.endURL}\n`;
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
       ${graph}
    </pre>
  </body>
</html>
`;

  prettier.format(html, { parser: "html" }).then((formatHTML) => {
    fs.writeFileSync("graph.html", formatHTML);
  });
}
