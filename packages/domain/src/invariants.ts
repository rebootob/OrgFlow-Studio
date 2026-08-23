import { OrgUnit, Position, Assignment, Employee } from './types.js';

export function calculateTreeInvariants(
  orgUnits: OrgUnit[],
  positions: Position[],
  assignments: Assignment[],
  employees: Employee[]
): {
  canonicalCount: number;
  overlayCount: number;
  totalNodeCount: number;
  totalPositions: number;
  activeEmployees: number;
  vacantPositions: number;
  orphanOrgCount: number;
  orphanPositionCount: number;
} {
  const orgMap = new Map(orgUnits.map(o => [o.code, o]));

  const canonicalCount = orgUnits.filter(o => !o.presentationOnly).length;
  const overlayCount = orgUnits.filter(o => o.presentationOnly).length;

  let orphanOrgCount = 0;
  for (const org of orgUnits) {
    if (org.parentCode && !orgMap.has(org.parentCode)) {
      orphanOrgCount++;
    }
  }

  let orphanPositionCount = 0;
  for (const pos of positions) {
    if (!orgMap.has(pos.orgUnitCode)) {
      orphanPositionCount++;
    }
  }

  const assignedPositionIds = new Set(assignments.map(a => a.positionId));
  const vacantPositions = positions.filter(p => !assignedPositionIds.has(p.id) || p.lifecycle === 'VACANT').length;

  return {
    canonicalCount,
    overlayCount,
    totalNodeCount: orgUnits.length,
    totalPositions: positions.length,
    activeEmployees: employees.length,
    vacantPositions,
    orphanOrgCount,
    orphanPositionCount
  };
}
