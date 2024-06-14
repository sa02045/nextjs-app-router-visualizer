import fs from "node:fs";

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

export function drawD2Graph() {
  let graph = "";
  Graph.forEach((value, startURL) => {
    value.forEach((v) => {
      const { endURL, trigger } = v;
      graph += getD2GraphLine(startURL, endURL, trigger);
    });
  });

  fs.writeFileSync("./graph.d2", graph);
}

function getD2GraphLine(startURL: string, endURL: string, trigger?: string) {
  return `${startURL} -> ${endURL}: ${trigger}\n`;
}
