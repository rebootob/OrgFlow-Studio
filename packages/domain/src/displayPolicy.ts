import { Position, OrgUnit, Employee, Assignment, VisibilityResolution, ChartVisibility } from './types.js';

export interface ResolveVisibilityOptions {
  position: Position;
  orgUnit?: OrgUnit;
  explicitOverride?: ChartVisibility;
}

/**
 * 1. Explicit Position Override (SHOW / HIDE)
 *      ↓
 * 2. Verified Organization Presentation Mapping (Executive/Leadership/SPMKT)
 *      ↓
 * 3. Default AUTO Rule (Levels 1-4 and Department/Section leadership -> SHOW; General operational staff -> HIDE)
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

  // 2. Verified Organization Presentation Mapping
  // Top Management & Executive anchors
  if (position.orgUnitCode === 'TTMET' || position.title.toLowerCase().includes('president')) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Executive Level 1 root node anchored on official organization chart'
    };
  }

  if (position.orgUnitCode.startsWith('DIV-') || position.title.toLowerCase().includes('vice president')) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Division Level 2 leadership anchored on official organization chart'
    };
  }

  // Support Marketing presentation overlay layer
  if (position.orgUnitCode.includes('SPMKT') || position.title.toLowerCase().includes('support marketing')) {
    return {
      positionId: position.id,
      visible: true,
      source: 'PRESENTATION_MAPPING',
      reason: 'Support Marketing (SPMKT) presentation matrix row'
    };
  }

  // 3. Default AUTO Rule
  if (orgUnit) {
    // Leadership of Departments (L3) & Sections (L4)
    if (orgUnit.level <= 4 && (
      position.title.toLowerCase().includes('manager') ||
      position.title.toLowerCase().includes('head') ||
      position.title.toLowerCase().includes('acting') ||
      position.title.toLowerCase().includes('chief') ||
      position.title.toLowerCase().includes('lead')
    )) {
      return {
        positionId: position.id,
        visible: true,
        source: 'AUTO_RULE',
        reason: `Leadership/Chief position in Level ${orgUnit.level} unit (${orgUnit.name})`
      };
    }

    // Key Team Leads and Functional Supervisors (L5/L6)
    if (orgUnit.level >= 5 && (
      position.title.toLowerCase().includes('manager') ||
      position.title.toLowerCase().includes('chief') ||
      position.title.toLowerCase().includes('lead') ||
      position.title.toLowerCase().includes('supervisor') ||
      position.title.toLowerCase().includes('specialist')
    )) {
      return {
        positionId: position.id,
        visible: true,
        source: 'AUTO_RULE',
        reason: `Functional Team Lead/Chief in Level ${orgUnit.level} unit (${orgUnit.name})`
      };
    }
  }

  // Default: Operational / Line / Clerical positions are summarized in unit headcount
  return {
    positionId: position.id,
    visible: false,
    source: 'AUTO_RULE',
    reason: 'Operational / staff role summarized in unit headcount and accessible via Right Detail Panel'
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
      reason: resolution.reason
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
