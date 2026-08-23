// -----------------------------------------------------------------------------
// Core Domain Models (Pure TypeScript - Position-Based Lifecycle)
// -----------------------------------------------------------------------------

export type OrgUnitType =
  | 'COMPANY'
  | 'DIVISION'
  | 'DEPARTMENT'
  | 'SECTION'
  | 'TEAM'
  | 'SUB-TEAM'
  | 'FUNCTION';

export interface OrgUnit {
  code: string;
  name: string;
  type: OrgUnitType | string;
  level: number;
  parentCode: string | null;
  isOverlay?: boolean;
  presentationOnly?: boolean;
  status?: 'ACTIVE' | 'NEW' | 'CLOSING' | 'CLOSED';
  effectiveDate?: string;
  closingReason?: string;
  isDraftOnly?: boolean;
}

export type PositionLifecycle =
  | 'PLANNED'
  | 'ACTIVE'
  | 'VACANT'
  | 'FROZEN'
  | 'CLOSING'
  | 'CLOSED';

export interface Position {
  id: string;
  code: string;
  title: string;
  orgUnitCode: string;
  reportsToPositionId: string | null;
  lifecycle: PositionLifecycle;
  effectiveFrom?: string;
  effectiveTo?: string;
  isDraftOnly?: boolean;
}

export interface Assignment {
  id: string;
  positionId: string;
  employeeId: string;
  isPrimary: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  nameTH: string;
  nameEN: string;
  nickname?: string;
  departmentId?: string;
  section?: string;
  team?: string;
  positionId?: string;
  positionTitle?: string;
  status: 'Active' | 'Resigned' | 'Suspended' | string;
  branch?: string;
}

export type ChangeOperationType =
  | 'MOVE_ORG_UNIT'
  | 'ADD_ORG_UNIT'
  | 'CLOSE_ORG_UNIT'
  | 'REMOVE_DRAFT_UNIT'
  | 'MOVE_POSITION'
  | 'ADD_POSITION'
  | 'CLOSE_POSITION'
  | 'MOVE_EMPLOYEE'
  | 'VACATE_POSITION';

export interface ChangeOperation {
  id: string;
  type: ChangeOperationType;
  targetId: string;
  targetName: string;
  from?: string | null;
  to?: string | null;
  details?: Record<string, any>;
  timestamp: string;
}

export interface OrganizationSnapshot {
  snapshotId: string;
  versionId: string;
  versionNumber: string;
  planName: string;
  createdAt: string;
  effectiveDate: string;
  orgUnits: OrgUnit[];
  positions: Position[];
  assignments: Assignment[];
  employees: Employee[];
  treeHash: string;
}

export interface DiffReport {
  timestamp?: string;
  baseVersion?: string;
  targetVersion?: string;
  movedEmployees?: Array<{
    employeeId: string;
    employeeName: string;
    fromPosition: string;
    toPosition: string;
  }>;
  createdPositions?: Array<{
    positionCode: string;
    title: string;
    orgUnitCode: string;
  }>;
  closedPositions?: Array<{
    positionCode: string;
    title: string;
    orgUnitCode: string;
  }>;
  vacatedPositions?: Array<{
    positionCode: string;
    title: string;
    orgUnitCode: string;
  }>;
  reportingChanges?: Array<{
    positionCode: string;
    fromReportsTo: string | null;
    toReportsTo: string | null;
  }>;
  headcountDelta?: {
    before: number;
    after: number;
    netChange: number;
  };
  unitChanges?: {
    added: OrgUnit[];
    removed: OrgUnit[];
    modified: Array<{ code: string; changes: Record<string, { from: any; to: any }> }>;
  };
  positionChanges?: {
    added: Position[];
    removed: Position[];
    modified: Array<{ id: string; code: string; title: string; changes: Record<string, { from: any; to: any }> }>;
  };
  assignmentChanges?: {
    reassigned: Array<{ employeeId: string; employeeName: string; fromPositionId: string; toPositionId: string }>;
    vacated: Array<{ positionId: string; positionTitle: string }>;
    filled: Array<{ positionId: string; positionTitle: string; employeeId: string; employeeName: string }>;
  };
}
