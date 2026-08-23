import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';

const elk = new ELK();

export interface LayoutOptions {
  direction?: 'DOWN' | 'RIGHT';
  nodeSpacing?: number;
  levelSpacing?: number;
  rootOrgCode?: string | null;
  canvasDisplayMode?: 'OVERVIEW' | 'ORGANIZATION' | 'PEOPLE';
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

  // Filter visible OrgUnits if rootOrgCode is set
  let visibleOrgs = orgUnits;
  if (options.rootOrgCode) {
    const includedCodes = new Set<string>([options.rootOrgCode]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const org of orgUnits) {
        if (org.parentCode && includedCodes.has(org.parentCode) && !includedCodes.has(org.code)) {
          includedCodes.add(org.code);
          changed = true;
        }
      }
    }
    visibleOrgs = orgUnits.filter(o => includedCodes.has(o.code));
  }

  // Group positions by OrgUnit
  const orgPositionsMap = new Map<string, Position[]>();
  positions.forEach(p => {
    const list = orgPositionsMap.get(p.orgUnitCode) || [];
    list.push(p);
    orgPositionsMap.set(p.orgUnitCode, list);
  });

  // Standardized node dimensions based on Summary on Canvas principle
  const nodeWidth = 280;
  let nodeHeight = 155; // Default ORGANIZATION mode
  if (options.canvasDisplayMode === 'OVERVIEW') {
    nodeHeight = 115;
  } else if (options.canvasDisplayMode === 'PEOPLE') {
    nodeHeight = 185;
  }

  // 1. Build ELK graph for Org Units
  const elkChildren: ElkNode[] = visibleOrgs.map(org => ({
    id: org.code,
    width: nodeWidth,
    height: nodeHeight
  }));

  const visibleOrgCodes = new Set(visibleOrgs.map(o => o.code));
  const elkEdges = visibleOrgs
    .filter(org => org.parentCode && visibleOrgCodes.has(org.parentCode))
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
      'elk.spacing.nodeNode': String(options.nodeSpacing || 48), // 30% reduction from 70
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.levelSpacing || 80), // 27% reduction from 110
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
      const org = visibleOrgs.find(o => o.code === elkChild.id);
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
          width: nodeWidth
        }
      });
    }
  }

  // 3. React Flow Edges (clean, subtle stroke)
  for (const org of visibleOrgs) {
    if (org.parentCode && visibleOrgCodes.has(org.parentCode)) {
      edges.push({
        id: `edge-${org.parentCode}-${org.code}`,
        source: org.parentCode,
        target: org.code,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#cbd5e1', strokeWidth: 1.5 }
      });
    }
  }

  return { nodes, edges };
}
