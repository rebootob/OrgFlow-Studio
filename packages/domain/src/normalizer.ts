import { OrgUnit, Position, Assignment, Employee } from './types.js';

export interface RawLegacyOrgRecord {
  code: string;
  name: string;
  type: string;
  level: number;
  parentCode: string | null;
  presentationOnly?: boolean;
}

export interface RawLegacyEmployeeRecord {
  emp_text?: { value: string };
  Number?: { value: string };
  Text_0?: { value: string }; // Name TH
  Text?: { value: string };   // Name EN
  Text_1?: { value: string }; // Nickname
  Drop_down?: { value: string }; // Direct Org Unit Code (e.g. TMG2, TMF1, TMH2)
  Drop_down_0?: { value: string }; // Dept
  Drop_down_1?: { value: string }; // Section
  Drop_down_2?: { value: string }; // Team
  Text_2?: { value: string }; // Position
  Status?: { value: string };
  Radio_button?: { value: string }; // Branch
  $id?: { value: string };
}

export const PRESENTATION_OVERLAY_NODES: OrgUnit[] = [
  { code: "TMT1-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMT1", presentationOnly: true },
  { code: "TMT2-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMT2", presentationOnly: true },
  { code: "TMF1-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMF1", presentationOnly: true },
  { code: "TMF2-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMF2", presentationOnly: true },
  { code: "TMF3-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMF3", presentationOnly: true },
  { code: "TME1-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TME1", presentationOnly: true },
  { code: "TMS1-SPMKT", name: "Support Marketing", type: "FUNCTION", level: 5, parentCode: "TMS1", presentationOnly: true }
];

export function normalizeRawEmployee(raw: RawLegacyEmployeeRecord): Employee {
  const id = raw.$id?.value || raw.emp_text?.value || '';
  const empCode = (raw.emp_text?.value && raw.emp_text.value.trim()) || (raw.Number?.value ? `EMP-${raw.Number.value.padStart(3, '0')}` : `REC-${id}`);
  const deptCode = raw.Drop_down?.value || raw.Drop_down_0?.value || '';
  return {
    id: String(id),
    employeeCode: empCode,
    nameTH: raw.Text_0?.value || '',
    nameEN: raw.Text?.value || '',
    nickname: raw.Text_1?.value || '',
    departmentId: deptCode,
    section: raw.Drop_down_1?.value || '',
    team: raw.Drop_down_2?.value || '',
    positionId: raw.Text_2?.value || '',
    status: raw.Status?.value || 'Active',
    branch: raw.Radio_button?.value || ''
  };
}

export function buildNormalizedDataset(
  canonicalOrgs: RawLegacyOrgRecord[],
  rawEmployees: RawLegacyEmployeeRecord[],
  includeOverlays: boolean = true
): {
  orgUnits: OrgUnit[];
  positions: Position[];
  assignments: Assignment[];
  employees: Employee[];
} {
  const orgUnits: OrgUnit[] = canonicalOrgs.map(o => ({
    code: o.code.trim(),
    name: o.name.trim(),
    type: o.type as any,
    level: Number(o.level),
    parentCode: o.parentCode ? o.parentCode.trim() : null,
    presentationOnly: false
  }));

  if (includeOverlays) {
    orgUnits.push(...PRESENTATION_OVERLAY_NODES);
  }

  const employees: Employee[] = rawEmployees.map(normalizeRawEmployee);

  // Derive Positions from Employee titles and Organization units
  const positions: Position[] = [];
  const assignments: Assignment[] = [];

  // Group employees by (orgUnitCode, positionTitle)
  employees.forEach((emp, index) => {
    // Find matching org unit code or fallback to TTMET
    const orgCode = emp.departmentId || 'TTMET';
    const posCode = `POS-${emp.employeeCode || index + 1}`;
    const posTitle = emp.positionId || 'Staff';

    const pos: Position = {
      id: `pos-uuid-${index + 1}`,
      code: posCode,
      title: posTitle,
      orgUnitCode: orgUnits.some(u => u.code === orgCode) ? orgCode : 'TTMET',
      reportsToPositionId: null, // Will be linked hierarchically
      lifecycle: 'ACTIVE'
    };
    positions.push(pos);

    const asg: Assignment = {
      id: `asg-uuid-${index + 1}`,
      positionId: pos.id,
      employeeId: emp.id,
      isPrimary: true
    };
    assignments.push(asg);
  });

  return {
    orgUnits,
    positions,
    assignments,
    employees
  };
}
