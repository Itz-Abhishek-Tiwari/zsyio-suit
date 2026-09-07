export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  shape?: "rectangle" | "cylinder" | "stadium" | "diamond";
  iconType?: string;
}

export interface ParsedFlowGraph {
  direction: "LR" | "TD";
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    data: FlowNodeData;
    type?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    type?: string;
  }>;
}

export function parseMermaidToFlow(code: string): ParsedFlowGraph | null {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%") && !l.startsWith("subgraph") && !l.startsWith("end"));

  if (lines.length === 0) return null;

  let direction: "LR" | "TD" = "LR";
  const headerMatch = lines[0].match(/^(?:graph|flowchart)\s+(LR|RL|TD|TB)/i);
  if (headerMatch) {
    direction = headerMatch[1].toUpperCase() === "TD" || headerMatch[1].toUpperCase() === "TB" ? "TD" : "LR";
    lines.shift();
  }

  const nodeMap = new Map<string, { label: string; shape?: "rectangle" | "cylinder" | "stadium" | "diamond" }>();
  const edgeList: Array<{ source: string; target: string; label?: string }> = [];

  const extractNode = (raw: string) => {
    raw = raw.trim();
    // Database: A[(Database)]
    const cylMatch = raw.match(/^([A-Za-z0-9_-]+)\[\((.*?)\)\]$/);
    if (cylMatch) {
      nodeMap.set(cylMatch[1], { label: cylMatch[2], shape: "cylinder" });
      return cylMatch[1];
    }
    // Stadium: A([Stadium])
    const stadMatch = raw.match(/^([A-Za-z0-9_-]+)\(\[(.*?)\]\)$/);
    if (stadMatch) {
      nodeMap.set(stadMatch[1], { label: stadMatch[2], shape: "stadium" });
      return stadMatch[1];
    }
    // Diamond: A{Diamond}
    const diaMatch = raw.match(/^([A-Za-z0-9_-]+)\{(.*?)\}$/);
    if (diaMatch) {
      nodeMap.set(diaMatch[1], { label: diaMatch[2], shape: "diamond" });
      return diaMatch[1];
    }
    // Rectangle: A[Rectangle]
    const rectMatch = raw.match(/^([A-Za-z0-9_-]+)\[(.*?)\]$/);
    if (rectMatch) {
      nodeMap.set(rectMatch[1], { label: rectMatch[2], shape: "rectangle" });
      return rectMatch[1];
    }
    // Rounded: A(Rounded)
    const roundMatch = raw.match(/^([A-Za-z0-9_-]+)\((.*?)\)$/);
    if (roundMatch) {
      nodeMap.set(roundMatch[1], { label: roundMatch[2], shape: "stadium" });
      return roundMatch[1];
    }
    // Plain ID: A
    const idMatch = raw.match(/^([A-Za-z0-9_-]+)$/);
    if (idMatch) {
      if (!nodeMap.has(idMatch[1])) {
        nodeMap.set(idMatch[1], { label: idMatch[1], shape: "rectangle" });
      }
      return idMatch[1];
    }
    return raw;
  };

  for (const line of lines) {
    // Check edge patterns:
    // A -->|Label| B
    const pipeMatch = line.match(/^(.*?)\s*--+>\s*\|(.*?)\|\s*(.*?)$/);
    if (pipeMatch) {
      const srcId = extractNode(pipeMatch[1]);
      const targetId = extractNode(pipeMatch[3]);
      edgeList.push({ source: srcId, target: targetId, label: pipeMatch[2].trim() });
      continue;
    }

    // A -- Label --> B
    const arrowLabelMatch = line.match(/^(.*?)\s*--\s*(.*?)\s*-->\s*(.*?)$/);
    if (arrowLabelMatch) {
      const srcId = extractNode(arrowLabelMatch[1]);
      const targetId = extractNode(arrowLabelMatch[3]);
      edgeList.push({ source: srcId, target: targetId, label: arrowLabelMatch[2].trim() });
      continue;
    }

    // A --> B or A ==> B or A -.-> B
    const simpleArrowMatch = line.match(/^(.*?)\s*(?:-->|==>|-\.->|---)\s*(.*?)$/);
    if (simpleArrowMatch) {
      const srcId = extractNode(simpleArrowMatch[1]);
      const targetId = extractNode(simpleArrowMatch[2]);
      edgeList.push({ source: srcId, target: targetId });
      continue;
    }

    // Standalone node declaration
    extractNode(line);
  }

  if (nodeMap.size === 0) return null;

  // Simple Topological / Rank-based layout
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of nodeMap.keys()) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const edge of edgeList) {
    if (adj.has(edge.source) && adj.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  // Assign ranks (levels)
  const rank = new Map<string, number>();
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      rank.set(id, 0);
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRank = rank.get(curr) || 0;
    const neighbors = adj.get(curr) || [];
    for (const n of neighbors) {
      const existing = rank.get(n) || 0;
      if (currRank + 1 > existing) {
        rank.set(n, currRank + 1);
      }
      queue.push(n);
    }
  }

  // Fallback for cycles or unranked nodes
  for (const id of nodeMap.keys()) {
    if (!rank.has(id)) {
      rank.set(id, 0);
    }
  }

  // Group nodes by rank for visual positioning
  const rankBuckets = new Map<number, string[]>();
  for (const [id, r] of rank.entries()) {
    if (!rankBuckets.has(r)) rankBuckets.set(r, []);
    rankBuckets.get(r)!.push(id);
  }

  const nodes: ParsedFlowGraph["nodes"] = [];
  const nodeWidth = 200;
  const nodeHeight = 70;
  const rankSpacing = 140;
  const siblingSpacing = 40;

  for (const [r, ids] of rankBuckets.entries()) {
    const totalHeight = ids.length * nodeHeight + (ids.length - 1) * siblingSpacing;
    const startY = -(totalHeight / 2) + 200;

    ids.forEach((id, idx) => {
      const nodeInfo = nodeMap.get(id)!;
      let x = 0;
      let y = 0;

      if (direction === "LR") {
        x = r * (nodeWidth + rankSpacing) + 50;
        y = startY + idx * (nodeHeight + siblingSpacing);
      } else {
        // Top-Down
        x = startY + idx * (nodeWidth + siblingSpacing);
        y = r * (nodeHeight + rankSpacing) + 50;
      }

      nodes.push({
        id,
        type: "customArchitectureNode",
        position: { x, y },
        data: {
          label: nodeInfo.label,
          shape: nodeInfo.shape,
        },
      });
    });
  }

  const edges: ParsedFlowGraph["edges"] = edgeList.map((e, idx) => ({
    id: `e-${e.source}-${e.target}-${idx}`,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    type: "smoothstep",
  }));

  return {
    direction,
    nodes,
    edges,
  };
}
