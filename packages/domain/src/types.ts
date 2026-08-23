export type OrgUnitType = 
  | 'COMPANY'
  | 'DIVISION'
  | 'DEPARTMENT'
  | 'SECTION'
  | 'TEAM'
  | 'SUB-TEAM'
  | 'FUNCTION';

export type PositionLifecycle = 
  | 'PLANNED'
  | 'ACTIVE'
  | 'VACANT'
  | 'FROZEN'
  | 'CLOSED';

export type VersionStatus = 
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'PRINTED_FOR_APPROVAL'
  | 'AWAITING_APPROVAL'
  | 'REJECTED'
  | 'APPROVED_LOCKED'
  | 'SYNCED';

export interface OrgUnit {
  code: string;
  name: string;
  type: OrgUnitType;
  level: number;
  parentCode: string | null;
  presentationOnly?: boolean;
}

export interface Employee {
  id: string; // Kintone Record ID or employeeId
  employeeCode: string;
  nameTH: string;
  nameEN: string;
  nickname?: string;
  departmentId?: string;
  section?: string;
  team?: string;
  positionId?: string;
  email?: string;
  status: string; // 'Active', etc.
  branch?: string;
}

export interface Position {
  id: string; // Internal UUID or canonical POS code
  code: string;
  title: string;
  orgUnitCode: string;
  reportsToPositionId: string | null;
  lifecycle: PositionLifecycle;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface Assignment {
  id: string;
  positionId: string;
  employeeId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPrimary: boolean;
}

export type OperationType = 
  | 'MOVE_EMPLOYEE'
  | 'CREATE_POSITION'
  | 'CLOSE_POSITION'
  | 'CHANGE_REPORTING_LINE'
  | 'VACATE_POSITION'
  | 'CREATE_ORG_UNIT'
  | 'UPDATE_ORG_UNIT';

export interface ChangeOperation {
  id: string;
  timestamp: number;
  type: OperationType;
  entityId: string;
  payload: Record<string, any>;
  previousState?: Record<string, any>;
}

export interface OrganizationSnapshot {
  snapshotId: string;
  versionId: string;
  versionNumber: string; // 'V1', 'V2', etc.
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
  movedEmployees: Array<{ employeeId: string; employeeName: string; fromPosition: string; toPosition: string }>;
  createdPositions: Array<{ positionCode: string; title: string; orgUnitCode: string }>;
  closedPositions: Array<{ positionCode: string; title: string; orgUnitCode: string }>;
  vacatedPositions: Array<{ positionCode: string; title: string; orgUnitCode: string }>;
  reportingChanges: Array<{ positionCode: string; fromReportsTo: string | null; toReportsTo: string | null }>;
  headcountDelta: { before: number; after: number; netChange: number };
}
