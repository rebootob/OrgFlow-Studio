import { z } from 'zod';
import { OrgUnit, Position, Assignment } from './types.js';

export const OrgUnitSchema = z.object({
  code: z.string().min(1, 'Org unit code is required'),
  name: z.string().min(1, 'Org unit name is required'),
  type: z.enum(['COMPANY', 'DIVISION', 'DEPARTMENT', 'SECTION', 'TEAM', 'SUB-TEAM', 'FUNCTION']),
  level: z.number().int().min(1).max(10),
  parentCode: z.string().nullable(),
  presentationOnly: z.boolean().optional()
});

export const PositionSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  orgUnitCode: z.string().min(1),
  reportsToPositionId: z.string().nullable(),
  lifecycle: z.enum(['PLANNED', 'ACTIVE', 'VACANT', 'FROZEN', 'CLOSED']),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional()
});

export const AssignmentSchema = z.object({
  id: z.string().min(1),
  positionId: z.string().min(1),
  employeeId: z.string().min(1),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  isPrimary: z.boolean()
});

export function detectCircularReporting(
  targetPositionId: string,
  newReportsToPositionId: string | null,
  positions: Map<string, Position>
): { hasCycle: boolean; path: string[] } {
  if (!newReportsToPositionId) {
    return { hasCycle: false, path: [] };
  }

  if (targetPositionId === newReportsToPositionId) {
    return { hasCycle: true, path: [targetPositionId, targetPositionId] };
  }

  const visited = new Set<string>();
  const path: string[] = [targetPositionId];
  let current: string | null = newReportsToPositionId;

  while (current) {
    path.push(current);
    if (current === targetPositionId) {
      return { hasCycle: true, path };
    }
    if (visited.has(current)) {
      break;
    }
    visited.add(current);
    const parentPos = positions.get(current);
    current = parentPos ? parentPos.reportsToPositionId : null;
  }

  return { hasCycle: false, path: [] };
}

export function validateOrganizationIntegrity(
  orgUnits: OrgUnit[],
  positions: Position[],
  assignments: Assignment[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const orgMap = new Map<string, OrgUnit>();
  orgUnits.forEach(o => orgMap.set(o.code, o));

  const posMap = new Map<string, Position>();
  positions.forEach(p => posMap.set(p.id, p));

  // 1. Check parent org units exist
  for (const org of orgUnits) {
    if (org.parentCode && !orgMap.has(org.parentCode)) {
      errors.push(`Orphan OrgUnit: ${org.code} refers to missing parent ${org.parentCode}`);
    }
  }

  // 2. Check positions belong to valid org units
  for (const pos of positions) {
    if (!orgMap.has(pos.orgUnitCode)) {
      errors.push(`Orphan Position: ${pos.code} (${pos.title}) belongs to missing OrgUnit ${pos.orgUnitCode}`);
    }
    if (pos.reportsToPositionId && !posMap.has(pos.reportsToPositionId)) {
      errors.push(`Position ${pos.code} reports to non-existent position ID ${pos.reportsToPositionId}`);
    }
    // Check circular reporting
    const cycle = detectCircularReporting(pos.id, pos.reportsToPositionId, posMap);
    if (cycle.hasCycle) {
      errors.push(`Circular reporting detected in position hierarchy: ${cycle.path.join(' -> ')}`);
    }
  }

  // 3. Check assignments
  const employeeActiveAssignment = new Map<string, string>();
  for (const asg of assignments) {
    if (!posMap.has(asg.positionId)) {
      errors.push(`Assignment ${asg.id} references non-existent position ${asg.positionId}`);
    }
    if (asg.isPrimary) {
      if (employeeActiveAssignment.has(asg.employeeId)) {
        errors.push(`Duplicate primary assignment for employee ${asg.employeeId} in position ${asg.positionId}`);
      } else {
        employeeActiveAssignment.set(asg.employeeId, asg.positionId);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
