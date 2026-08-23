import { Position, OrgUnit, Employee, Assignment, VisibilityResolution, ChartVisibility } from './types.js';

export interface ResolveVisibilityOptions {
  position: Position;
  orgUnit?: OrgUnit;
  explicitOverride?: ChartVisibility;
}

/**
 * Deterministic Policy Precedence:
 * 1. Explicit Position Override (SHOW / HIDE)
 *      ↓
 * 2. Verified Organization Presentation Mapping (Executive / Leadership / SPMKT)
 *      ↓
 * 3. Structural AUTO Default Rule (Unit Heads of L1-L4 and Team Chiefs of L5 -> SHOW; General operational staff -> HIDE)
 */
export function resolveChartVisibility(options: ResolveVisibilityOptions): VisibilityResolution {
  const { position, orgUnit, explicitOverride } = options;
  const effectiveSetting = explicitOverride || position.chartVisibility || 'AUTO';

  // 1. Explicit Position Override
  if (effectiveSetting === 'SHOW') {
    return {
      positionId: position.id,
      visible: true,
      source: 'EXPLICIT_SHOW',
      reason: 'Explicit position override set to SHOW by user/configuration'
    };
  }

  if (effectiveSetting === 'HIDE') {
    return {
      positionId: position.id,
      visible: false,
      source: 'EXPLICIT_HIDE',
      reason: 'Explicit position override set to HIDE by user/configuration'
    };
  }

  const titleLower = (position.title || '').toLowerCase();

  // 2. Verified Organization Presentation Mapping (Executive & Presentation Anchors)
  if (titleLower.includes('president') && !titleLower.includes('vice')) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Executive Level 1 President root node anchored on official organization chart'
    };
  }

  if (titleLower.includes('vice president') || (orgUnit && orgUnit.level === 2 && titleLower.includes('vp'))) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Division Level 2 Vice President leadership anchored on official organization chart'
    };
  }

  if (position.orgUnitCode.includes('SPMKT') || titleLower.includes('support marketing')) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Support Marketing (SPMKT) cross-functional presentation matrix row'
    };
  }

  // 3. Structural AUTO Default Rule (Structural Unit Heads & Official Team Chiefs)
  if (orgUnit) {
    // Level 3 Departments (e.g. TMT0, TMF0, TME0, TMS0, TMG0, TMH0)
    // Show General Manager, Deputy General Manager, Factory Manager
    if (orgUnit.level === 3) {
      if (titleLower.includes('general manager') || titleLower.includes('factory manager') || titleLower.includes('dgm') || (titleLower.includes('manager') && titleLower.includes('acting'))) {
        return {
          positionId: position.id,
          visible: true,
          source: 'AUTO_RULE',
          reason: `Department Head position in Level 3 unit (${orgUnit.name})`
        };
      }
    }

    // Level 4 Sections (e.g. TMT1-TMS1, TMG1-TMG2, TMH1-TMH3)
    // Show Section Manager / Acting Section Manager
    if (orgUnit.level === 4) {
      if (titleLower.includes('manager') || titleLower.includes('acting') || titleLower.includes('head') || titleLower.includes('chief')) {
        return {
          positionId: position.id,
          visible: true,
          source: 'AUTO_RULE',
          reason: `Section Manager leadership in Level 4 unit (${orgUnit.name})`
        };
      }
    }

    // Level 5 Teams (e.g. Machine & Equipments, CAD Team, Automotive Team, IT Chief, Chief Accountant)
    // Show official Team Lead / Chief of the sub-unit
    if (orgUnit.level === 5) {
      if (titleLower.includes('chief') || titleLower.includes('lead') || titleLower.includes('asst. manager') || titleLower.includes('assistant manager') || titleLower.includes('supervisor')) {
        return {
          positionId: position.id,
          visible: true,
          source: 'AUTO_RULE',
          reason: `Team Chief / Lead in Level 5 functional sub-unit (${orgUnit.name})`
        };
      }
    }
  }

  // Operational staff, technicians, operators, clerical roles in Level 5, 6, 7 units are summarized in unit headcount
  return {
    positionId: position.id,
    visible: false,
    source: 'AUTO_RULE',
    reason: `Operational position in Level ${orgUnit ? orgUnit.level : 0} unit summarized in headcount (accessible via Detail Panel & Search)`
  };
}

export interface PositionDisplayMatrixRow {
  positionId: string;
  positionCode: string;
  positionTitle: string;
  orgUnitCode: string;
  orgUnitName: string;
  orgUnitLevel: number;
  incumbentName: string;
  isVacant: boolean;
  setting: ChartVisibility;
  resolvedVisible: boolean;
  source: string;
  reason: string;
  referenceMatch: 'MATCH' | 'CURRENT_ONLY' | 'NOT_DISPLAYED';
  confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_REVIEW';
}

export function buildPositionDisplayMatrix(
  positions: Position[],
  orgUnits: OrgUnit[],
  employees: Employee[],
  assignments: Assignment[],
  overrides?: Map<string, ChartVisibility>
): PositionDisplayMatrixRow[] {
  const orgMap = new Map<string, OrgUnit>();
  orgUnits.forEach(o => orgMap.set(o.code, o));

  const asgMap = new Map<string, Assignment>();
  assignments.forEach(a => asgMap.set(a.positionId, a));

  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.id, e));

  return positions.map(pos => {
    const org = orgMap.get(pos.orgUnitCode);
    const asg = asgMap.get(pos.id);
    const emp = asg ? empMap.get(asg.employeeId) : null;
    const isVacant = pos.lifecycle === 'VACANT' || !asg;
    const override = overrides ? overrides.get(pos.id) : undefined;
    const resolution = resolveChartVisibility({ position: pos, orgUnit: org, explicitOverride: override });

    // Determine reference match and confidence
    let referenceMatch: 'MATCH' | 'CURRENT_ONLY' | 'NOT_DISPLAYED' = 'NOT_DISPLAYED';
    let confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_REVIEW' = 'HIGH';

    if (resolution.visible) {
      if (resolution.source === 'PRESENTATION_MAPPING' || (org && org.level <= 4)) {
        referenceMatch = 'MATCH';
        confidence = 'HIGH';
      } else if (org && org.level === 5) {
        referenceMatch = 'CURRENT_ONLY';
        confidence = 'HIGH';
      } else {
        referenceMatch = 'CURRENT_ONLY';
        confidence = 'NEEDS_REVIEW';
      }
    }

    return {
      positionId: pos.id,
      positionCode: pos.code,
      positionTitle: pos.title,
      orgUnitCode: pos.orgUnitCode,
      orgUnitName: org ? org.name : 'Unknown',
      orgUnitLevel: org ? org.level : 0,
      incumbentName: emp ? `${emp.nameEN} (${emp.employeeCode})` : (isVacant ? '[VACANT]' : 'Unassigned'),
      isVacant,
      setting: override || pos.chartVisibility || 'AUTO',
      resolvedVisible: resolution.visible,
      source: resolution.source,
      reason: resolution.reason,
      referenceMatch,
      confidence
    };
  });
}

export interface AssignmentHealthReport {
  totalEmployees: number;
  activeEmployees: number;
  assignedEmployees: number;
  unassignedEmployees: number;
  duplicateAssignments: number;
  missingPositions: number;
  missingOrganizations: number;
  isHealthy: boolean;
}

export function validateAssignmentHealth(
  employees: Employee[],
  positions: Position[],
  orgUnits: OrgUnit[],
  assignments: Assignment[]
): AssignmentHealthReport {
  const activeEmps = employees.filter(e => e.status === 'Active');
  const posMap = new Map<string, Position>();
  positions.forEach(p => posMap.set(p.id, p));

  const orgMap = new Map<string, OrgUnit>();
  orgUnits.forEach(o => orgMap.set(o.code, o));

  const asgByEmpId = new Map<string, Assignment[]>();
  assignments.forEach(a => {
    const list = asgByEmpId.get(a.employeeId) || [];
    list.push(a);
    asgByEmpId.set(a.employeeId, list);
  });

  let assignedCount = 0;
  let unassignedCount = 0;
  let duplicateCount = 0;
  let missingPosCount = 0;
  let missingOrgCount = 0;

  activeEmps.forEach(emp => {
    const asgs = asgByEmpId.get(emp.id) || [];
    if (asgs.length === 0) {
      unassignedCount++;
    } else {
      assignedCount++;
      if (asgs.length > 1) {
        duplicateCount++;
      }
      const pos = posMap.get(asgs[0].positionId);
      if (!pos) {
        missingPosCount++;
      } else {
        const org = orgMap.get(pos.orgUnitCode);
        if (!org) {
          missingOrgCount++;
        }
      }
    }
  });

  const isHealthy = unassignedCount === 0 && duplicateCount === 0 && missingPosCount === 0 && missingOrgCount === 0;

  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmps.length,
    assignedEmployees: assignedCount,
    unassignedEmployees: unassignedCount,
    duplicateAssignments: duplicateCount,
    missingPositions: missingPosCount,
    missingOrganizations: missingOrgCount,
    isHealthy
  };
}
