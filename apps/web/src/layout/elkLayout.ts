import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';

const elk = new ELK();

export interface LayoutOptions {
  direction?: 'DOWN' | 'RIGHT';
  nodeSpacing?: number;
  levelSpacing?: number;
}

export async function layoutOrgChart(
  orgUnits: OrgUnit[],
  positions: Position[],
  assignments: Assignment[],
  employees: Employee[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const empMap = new Map(employees.map(e => [e.id, e]));
  const asgMap = new Map(assignments.map(a => [a.positionId, a]));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Group positions by OrgUnit
  const orgPositionsMap = new Map<string, Position[]>();
  positions.forEach(p => {
    const list = orgPositionsMap.get(p.orgUnitCode) || [];
    list.push(p);
    orgPositionsMap.set(p.orgUnitCode, list);
  });

  // 1. Build ELK graph for Org Units
  const elkChildren: ElkNode[] = orgUnits.map(org => {
    const orgPosList = orgPositionsMap.get(org.code) || [];
    // Estimate height based on positions inside
    const width = 340;
    const height = Math.max(120, 70 + orgPosList.length * 75);
    return {
      id: org.code,
      width,
      height
    };
  });

  const elkEdges = orgUnits
    .filter(org => org.parentCode)
    .map(org => ({
      id: `edge-${org.parentCode}-${org.code}`,
      sources: [org.parentCode!],
      targets: [org.code]
    }));

  const rootGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': options.direction || 'DOWN',
      'elk.spacing.nodeNode': String(options.nodeSpacing || 60),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.levelSpacing || 100),
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.alignment': 'CENTER'
    },
    children: elkChildren,
    edges: elkEdges
  };

  const layoutedGraph = await elk.layout(rootGraph);

  // 2. Convert ELK layout to React Flow nodes and edges
  if (layoutedGraph.children) {
    for (const elkChild of layoutedGraph.children) {
      const org = orgUnits.find(o => o.code === elkChild.id);
      if (!org) continue;

      const orgPosList = orgPositionsMap.get(org.code) || [];
      const orgPositionsWithDetails = orgPosList.map(pos => {
        const asg = asgMap.get(pos.id);
        const emp = asg ? empMap.get(asg.employeeId) : undefined;
        return {
          position: pos,
          assignment: asg,
          employee: emp
        };
      });

      nodes.push({
        id: org.code,
        type: 'orgUnitNode',
        position: { x: elkChild.x || 0, y: elkChild.y || 0 },
        data: {
          orgUnit: org,
          positions: orgPositionsWithDetails
        },
        style: {
          width: elkChild.width || 340
        }
      });
    }
  }

  // 3. React Flow Edges
  for (const org of orgUnits) {
    if (org.parentCode) {
      edges.push({
        id: `edge-${org.parentCode}-${org.code}`,
        source: org.parentCode,
        target: org.code,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#475569', strokeWidth: 2 }
      });
    }
  }

  return { nodes, edges };
}
