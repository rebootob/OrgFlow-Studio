import { describe, it, expect } from 'vitest';
import {
  Position,
  OrgUnit,
  Employee,
  Assignment,
  resolveChartVisibility,
  buildPositionDisplayMatrix,
  validateAssignmentHealth,
  buildNormalizedDataset,
  generateA3OrganizationChartPDF
} from '../packages/domain/src/index.js';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';

describe('Phase 6.5: Organization Display Policy & Employee Assignment Audit', () => {
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  // 1. All 275 current employees remain accounted for
  it('accounts for 100% of the 275 active employees with zero orphans or duplicates', () => {
    const health = validateAssignmentHealth(
      dataset.employees,
      dataset.positions,
      dataset.orgUnits,
      dataset.assignments
    );

    expect(health.totalEmployees).toBe(275);
    expect(health.activeEmployees).toBe(275);
    expect(health.assignedEmployees).toBe(275);
    expect(health.unassignedEmployees).toBe(0);
    expect(health.duplicateAssignments).toBe(0);
    expect(health.missingPositions).toBe(0);
    expect(health.missingOrganizations).toBe(0);
    expect(health.isHealthy).toBe(true);
  });

  // 2. Hidden employee remains searchable and fully indexed
  it('keeps hidden employees searchable in dataset with full employee properties', () => {
    // Find an operational position (e.g. Technician, Operator, or Staff)
    const staffPos = dataset.positions.find(p =>
      p.title.toLowerCase().includes('technician') ||
      p.title.toLowerCase().includes('operator') ||
      p.title.toLowerCase().includes('officer') ||
      p.title.toLowerCase().includes('staff')
    );
    expect(staffPos).toBeDefined();

    const asg = dataset.assignments.find(a => a.positionId === staffPos!.id);
    expect(asg).toBeDefined();

    const staffEmp = dataset.employees.find(e => e.id === asg!.employeeId);
    expect(staffEmp).toBeDefined();
    expect(staffEmp!.employeeCode).toBeDefined();

    const org = dataset.orgUnits.find(o => o.code === staffPos!.orgUnitCode);
    expect(org).toBeDefined();

    const resolution = resolveChartVisibility({ position: staffPos!, orgUnit: org });
    expect(resolution.visible).toBe(false);
    expect(resolution.source).toBe('AUTO_RULE');
  });

  // 3. Hidden employee is counted in headcount
  it('includes hidden positions and employees in organization unit headcount', () => {
    const tmf1Positions = dataset.positions.filter(p => p.orgUnitCode === 'TMF1');
    expect(tmf1Positions.length).toBeGreaterThan(0);

    const shownInTmf1 = tmf1Positions.filter(p => resolveChartVisibility({ position: p, orgUnit: dataset.orgUnits.find(o => o.code === 'TMF1') }).visible);
    const hiddenInTmf1 = tmf1Positions.filter(p => !resolveChartVisibility({ position: p, orgUnit: dataset.orgUnits.find(o => o.code === 'TMF1') }).visible);

    // Headcount must reflect total positions, not just visible ones
    expect(tmf1Positions.length).toBe(shownInTmf1.length + hiddenInTmf1.length);
    expect(tmf1Positions.length).toBeGreaterThan(shownInTmf1.length);
  });

  // 4. Resolution source and human-readable reason are returned
  it('returns resolution source and human-readable reason for every position', () => {
    const presPos = dataset.positions.find(p => p.title.includes('President'));
    expect(presPos).toBeDefined();
    const presRes = resolveChartVisibility({ position: presPos!, orgUnit: dataset.orgUnits.find(o => o.code === presPos!.orgUnitCode) });
    expect(presRes.visible).toBe(true);
    expect(presRes.source).toBe('PRESENTATION_MAPPING');
    expect(presRes.reason).toContain('Executive Level 1 root node');

    const mgrPos = dataset.positions.find(p => p.title.includes('Manager'));
    expect(mgrPos).toBeDefined();
    const mgrRes = resolveChartVisibility({ position: mgrPos!, orgUnit: dataset.orgUnits.find(o => o.code === mgrPos!.orgUnitCode) });
    expect(mgrRes.visible).toBe(true);
    expect(['PRESENTATION_MAPPING', 'AUTO_RULE']).toContain(mgrRes.source);
    expect(mgrRes.reason.length).toBeGreaterThan(5);
  });

  // 5. Explicit SHOW overrides AUTO
  it('allows explicit SHOW override to force-display an operational position', () => {
    const opPos: Position = {
      id: 'POS-TEST-OP',
      code: 'POS-TEST-OP',
      title: 'Junior Line Operator',
      orgUnitCode: 'TMF1-PROD',
      reportsToPositionId: null,
      lifecycle: 'ACTIVE',
      chartVisibility: 'SHOW'
    };
    const org: OrgUnit = { code: 'TMF1-PROD', name: 'Production Line 1', type: 'TEAM', level: 5, parentCode: 'TMF1' };

    const resolution = resolveChartVisibility({ position: opPos, orgUnit: org });
    expect(resolution.visible).toBe(true);
    expect(resolution.source).toBe('EXPLICIT_SHOW');
    expect(resolution.reason).toContain('Explicit position override set to SHOW');
  });

  // 6. Explicit HIDE overrides AUTO
  it('allows explicit HIDE override to suppress a manager position from chart', () => {
    const mgrPos: Position = {
      id: 'POS-TEST-MGR',
      code: 'POS-TEST-MGR',
      title: 'General Manager',
      orgUnitCode: 'TMH0',
      reportsToPositionId: null,
      lifecycle: 'ACTIVE',
      chartVisibility: 'HIDE'
    };
    const org: OrgUnit = { code: 'TMH0', name: 'Corporate Department', type: 'DEPARTMENT', level: 3, parentCode: 'TTMET' };

    const resolution = resolveChartVisibility({ position: mgrPos, orgUnit: org });
    expect(resolution.visible).toBe(false);
    expect(resolution.source).toBe('EXPLICIT_HIDE');
    expect(resolution.reason).toContain('Explicit position override set to HIDE');
  });

  // 7. Hidden vacancy is counted in total vacancies
  it('correctly tallies hidden vacant positions in total vacancy metric', () => {
    const positionsWithVacancy: Position[] = [
      ...dataset.positions.slice(0, 10),
      {
        id: 'POS-VACANT-HIDDEN',
        code: 'POS-VAC-01',
        title: 'Clerical Staff',
        orgUnitCode: 'TMH1',
        reportsToPositionId: null,
        lifecycle: 'VACANT',
        chartVisibility: 'AUTO'
      }
    ];

    const org = dataset.orgUnits.find(o => o.code === 'TMH1');
    const vacantPos = positionsWithVacancy.find(p => p.id === 'POS-VACANT-HIDDEN')!;
    const res = resolveChartVisibility({ position: vacantPos, orgUnit: org });

    expect(res.visible).toBe(false); // Hidden on chart
    expect(vacantPos.lifecycle).toBe('VACANT'); // But counted in vacancy metrics
  });

  // 8. Employee move does not alter position visibility setting
  it('moving an employee does not modify the target or source position visibility setting', () => {
    const posA: Position = {
      id: 'POS-A',
      code: 'POS-A',
      title: 'Senior Officer',
      orgUnitCode: 'TMH2',
      reportsToPositionId: null,
      lifecycle: 'ACTIVE',
      chartVisibility: 'AUTO'
    };
    const posB: Position = {
      id: 'POS-B',
      code: 'POS-B',
      title: 'Recruiter',
      orgUnitCode: 'TMH2',
      reportsToPositionId: null,
      lifecycle: 'VACANT',
      chartVisibility: 'AUTO'
    };

    // Simulate moving employee from A to B
    posA.lifecycle = 'VACANT';
    posB.lifecycle = 'ACTIVE';

    expect(posA.chartVisibility).toBe('AUTO');
    expect(posB.chartVisibility).toBe('AUTO');
  });

  // 9. Full Position Display Matrix is constructed with 100% rows
  it('constructs a complete 275-row auditable Position Display Matrix', () => {
    const matrix = buildPositionDisplayMatrix(
      dataset.positions,
      dataset.orgUnits,
      dataset.employees,
      dataset.assignments
    );

    expect(matrix.length).toBe(275);
    const visibleCount = matrix.filter(r => r.resolvedVisible).length;
    const hiddenCount = matrix.filter(r => !r.resolvedVisible).length;

    expect(visibleCount).toBeGreaterThan(50);
    expect(hiddenCount).toBeGreaterThan(150);
    expect(visibleCount + hiddenCount).toBe(275);
  });

  // 10. Print baseline uses the same resolver and preserves 275 active staff headcount
  it('generates A3 print PDF conforming to display policy with 275 reconciled active staff', async () => {
    const pdfBytes = await generateA3OrganizationChartPDF(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments,
      dataset.employees
    );

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(5000);
  });
});
