import { z } from 'zod';
import { OrgUnit, Position, Assignment } from './types.js';

export const OrgUnitSchema = z.object({
  code: z.string().min(1, 'Organization code is required'),
  name: z.string().min(1, 'Organization name is required'),
  type: z.string().min(1, 'Organization type is required'),
  level: z.number().int().positive('Level must be positive'),
  parentCode: z.string().nullable()
});

export const PositionSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  orgUnitCode: z.string().min(1),
  reportsToPositionId: z.string().nullable(),
  lifecycle: z.enum(['PLANNED', 'ACTIVE', 'VACANT', 'FROZEN', 'CLOSING', 'CLOSED'])
});

export const AssignmentSchema = z.object({
  id: z.string().min(1),
  positionId: z.string().min(1),
  employeeId: z.string().min(1),
  isPrimary: z.boolean()
});

/**
 * Validates whether an Organization Unit can be moved under a target parent.
 * Rejects self-reparenting, descendant cycles, and invalid targets.
 */
export function canReparentOrgUnit(
  unitCode: string,
  newParentCode: string,
  orgUnits: OrgUnit[]
): { allowed: boolean; reason?: string } {
  if (unitCode === newParentCode) {
    return {
      allowed: false,
      reason: `Cannot move organization unit "${unitCode}" under itself.`
    };
  }

  const parent = orgUnits.find(o => o.code === newParentCode);
  if (!parent) {
    return {
      allowed: false,
      reason: `Target parent unit "${newParentCode}" does not exist.`
    };
  }

  // Check if newParentCode is currently a descendant of unitCode
  const descendantCodes = new Set<string>([unitCode]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const org of orgUnits) {
      if (org.parentCode && descendantCodes.has(org.parentCode) && !descendantCodes.has(org.code)) {
        descendantCodes.add(org.code);
        changed = true;
      }
    }
  }

  if (descendantCodes.has(newParentCode)) {
    return {
      allowed: false,
      reason: `Cannot move "${unitCode}" under "${newParentCode}" because "${newParentCode}" is already inside "${unitCode}".`
    };
  }

  return { allowed: true };
}

/**
 * Validates whether an Organization Unit can be closed.
 * Blocks closing if active staff, positions, or sub-units are still assigned.
 */
export function canCloseOrgUnit(
  unitCode: string,
  orgUnits: OrgUnit[],
  positions: Position[],
  assignments: Assignment[]
): {
  allowed: boolean;
  remainingStaff: number;
  remainingPositions: number;
  remainingChildUnits: number;
  reason?: string;
} {
  const childUnits = orgUnits.filter(o => o.parentCode === unitCode && o.status !== 'CLOSED');
  const unitPositions = positions.filter(p => p.orgUnitCode === unitCode && p.lifecycle !== 'CLOSED');
  const posIds = new Set(unitPositions.map(p => p.id));
  const activeAssignments = assignments.filter(a => posIds.has(a.positionId));

  const remainingStaff = activeAssignments.length;
  const remainingPositions = unitPositions.length;
  const remainingChildUnits = childUnits.length;

  if (remainingStaff > 0 || remainingPositions > 0 || remainingChildUnits > 0) {
    return {
      allowed: false,
      remainingStaff,
      remainingPositions,
      remainingChildUnits,
      reason: `Cannot close "${unitCode}" yet. Resolve remaining ${remainingStaff} staff, ${remainingPositions} positions, and ${remainingChildUnits} child units first.`
    };
  }

  return {
    allowed: true,
    remainingStaff: 0,
    remainingPositions: 0,
    remainingChildUnits: 0
  };
}

/**
 * Validates complete hierarchy integrity (0 orphan orgs, 0 duplicate assignments, 0 circular reporting).
 */
export function validateOrganizationIntegrity(
  orgUnits: OrgUnit[],
  positions: Position[],
  assignments: Assignment[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const orgCodeSet = new Set(orgUnits.map(o => o.code));
  const posIdSet = new Set(positions.map(p => p.id));
  const posMap = new Map(positions.map(p => [p.id, p]));

  // 1. Orphan Org Units
  for (const org of orgUnits) {
    if (org.parentCode && !orgCodeSet.has(org.parentCode)) {
      errors.push(`Orphan OrgUnit: ${org.code} (${org.name}) has nonexistent parentCode ${org.parentCode}`);
    }
  }

  // 2. Orphan Positions
  for (const pos of positions) {
    if (!orgCodeSet.has(pos.orgUnitCode)) {
      errors.push(`Orphan Position: ${pos.id} (${pos.title}) belongs to nonexistent orgUnitCode ${pos.orgUnitCode}`);
    }
  }

  // 3. Orphan Assignments & Duplicate Active Assignments
  const activeEmployeeSet = new Set<string>();
  for (const asg of assignments) {
    if (!posIdSet.has(asg.positionId)) {
      errors.push(`Orphan Assignment: ${asg.id} references nonexistent positionId ${asg.positionId}`);
    }
    if (activeEmployeeSet.has(asg.employeeId)) {
      errors.push(`Duplicate Active Assignment: Employee ${asg.employeeId} has multiple active primary assignments`);
    }
    activeEmployeeSet.add(asg.employeeId);
  }

  // 4. Circular Reporting in Positions
  for (const pos of positions) {
    if (pos.reportsToPositionId) {
      const cycle = detectCircularReporting(pos.id, pos.reportsToPositionId, posMap);
      if (cycle.hasCycle) {
        errors.push(`Circular Reporting detected: ${cycle.path.join(' -> ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Traverses reporting chain to detect cycles
 */
export function detectCircularReporting(
  startPosId: string,
  targetReportsToId: string,
  positionsMap: Map<string, Position>
): { hasCycle: boolean; path: string[] } {
  const visited = new Set<string>([startPosId]);
  const path: string[] = [startPosId, targetReportsToId];
  let currId: string | null = targetReportsToId;

  while (currId) {
    if (visited.has(currId)) {
      return { hasCycle: true, path };
    }
    visited.add(currId);
    const nextPos = positionsMap.get(currId);
    if (!nextPos || !nextPos.reportsToPositionId) {
      break;
    }
    currId = nextPos.reportsToPositionId;
    path.push(currId);
  }

  return { hasCycle: false, path: [] };
}