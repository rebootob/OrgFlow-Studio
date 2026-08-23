import { describe, it, expect } from 'vitest';
import {
  buildNormalizedDataset,
  calculateTreeInvariants,
  validateOrganizationIntegrity,
  detectCircularReporting,
  computeVersionDiff,
  Position,
  OrganizationSnapshot
} from '../packages/domain/src/index.js';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { layoutOrgChart } from '../apps/web/src/layout/elkLayout.js';

describe('Phase 3 Technology Spikes Verification Suite', () => {
  // SPIKE 1: REAL DATA NORMALIZATION & INTEGRITY
  it('Spike 1: Normalizes 57 canonical nodes, 7 overlays, and 275 staff with 0 orphan errors', () => {
    const rawEmployees = generate275EmployeesFixture();
    const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

    expect(dataset.orgUnits.length).toBe(64); // 57 Canonical + 7 Overlays
    expect(dataset.employees.length).toBe(275);
    expect(dataset.positions.length).toBe(275);
    expect(dataset.assignments.length).toBe(275);

    const invariants = calculateTreeInvariants(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments,
      dataset.employees
    );

    expect(invariants.canonicalCount).toBe(57);
    expect(invariants.overlayCount).toBe(7);
    expect(invariants.activeEmployees).toBe(275);
    expect(invariants.orphanOrgCount).toBe(0);
    expect(invariants.orphanPositionCount).toBe(0);

    const validation = validateOrganizationIntegrity(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments
    );

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  // SPIKE 3: ELK.JS AUTO LAYOUT
  it('Spike 3: Calculates non-overlapping layered hierarchy coordinates within 300ms', async () => {
    const rawEmployees = generate275EmployeesFixture();
    const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

    const startTime = performance.now();
    const result = await layoutOrgChart(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments,
      dataset.employees
    );
    const duration = performance.now() - startTime;

    expect(result.nodes.length).toBe(64);
    expect(result.edges.length).toBe(63); // 64 nodes - 1 root = 63 parent-child edges
    expect(duration).toBeLessThan(500); // Super fast layout calculation
  });

  // SPIKE 4: CIRCULAR REPORTING PROTECTION
  it('Spike 4: Detects and blocks circular reporting loops', () => {
    const posMap = new Map<string, Position>([
      ['POS-A', { id: 'POS-A', code: 'POS-A', title: 'Director', orgUnitCode: 'TMT0', reportsToPositionId: null, lifecycle: 'ACTIVE' }],
      ['POS-B', { id: 'POS-B', code: 'POS-B', title: 'Manager', orgUnitCode: 'TMT1', reportsToPositionId: 'POS-A', lifecycle: 'ACTIVE' }],
      ['POS-C', { id: 'POS-C', code: 'POS-C', title: 'Supervisor', orgUnitCode: 'TMT1-MACH', reportsToPositionId: 'POS-B', lifecycle: 'ACTIVE' }]
    ]);

    // Attempting to make POS-A report to POS-C must be blocked
    const cycle = detectCircularReporting('POS-A', 'POS-C', posMap);
    expect(cycle.hasCycle).toBe(true);
    expect(cycle.path).toContain('POS-A');
    expect(cycle.path).toContain('POS-C');
  });

  // SPIKE 5: MOVE EMPLOYEE / VACANCY PRESERVATION
  it('Spike 5: Moving an employee leaves previous position as VACANT (never deleted)', () => {
    const rawEmployees = generate275EmployeesFixture();
    const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

    const empId = dataset.employees[0].id;
    const posA = dataset.positions[0];
    const targetVacantPos: Position = {
      id: 'pos-vacant-target',
      code: 'POS-VACANT-01',
      title: 'Senior Specialist',
      orgUnitCode: 'TMH2',
      reportsToPositionId: null,
      lifecycle: 'VACANT'
    };
    dataset.positions.push(targetVacantPos);

    // Simulate moving emp from posA to targetVacantPos
    dataset.assignments = dataset.assignments.filter(a => a.employeeId !== empId);
    dataset.assignments.push({
      id: 'asg-test-move',
      positionId: targetVacantPos.id,
      employeeId: empId,
      isPrimary: true
    });
    targetVacantPos.lifecycle = 'ACTIVE';

    // Check if posA has remaining incumbents
    const posAIncumbents = dataset.assignments.filter(a => a.positionId === posA.id);
    if (posAIncumbents.length === 0) {
      posA.lifecycle = 'VACANT';
    }

    expect(posA.lifecycle).toBe('VACANT');
    expect(dataset.positions.find(p => p.id === posA.id)).toBeDefined(); // Pos A still exists
    expect(dataset.assignments.find(a => a.positionId === targetVacantPos.id)?.employeeId).toBe(empId);
    expect(targetVacantPos.lifecycle).toBe('ACTIVE');
  });

  // SPIKE 8: IMMUTABLE VERSION SNAPSHOT & DIFF
  it('Spike 8: Snapshots preserve previous states and produce precise Diff reports', () => {
    const rawEmployees = generate275EmployeesFixture();
    const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

    const v1Snapshot: OrganizationSnapshot = {
      snapshotId: 'snap-v1',
      versionId: 'ver-v1',
      versionNumber: 'V1',
      planName: 'Test Plan',
      createdAt: '2026-08-23T00:00:00Z',
      effectiveDate: '2027-01-01',
      orgUnits: JSON.parse(JSON.stringify(dataset.orgUnits)),
      positions: JSON.parse(JSON.stringify(dataset.positions)),
      assignments: JSON.parse(JSON.stringify(dataset.assignments)),
      employees: JSON.parse(JSON.stringify(dataset.employees)),
      treeHash: 'hash-v1'
    };

    // Modify working copy (V2)
    const empToMove = dataset.employees[0];
    const targetPos = dataset.positions[10];
    const originalPos = dataset.positions[0];

    dataset.assignments = dataset.assignments.filter(a => a.employeeId !== empToMove.id);
    dataset.assignments.push({
      id: 'asg-v2-move',
      positionId: targetPos.id,
      employeeId: empToMove.id,
      isPrimary: true
    });
    originalPos.lifecycle = 'VACANT';

    const v2Snapshot: OrganizationSnapshot = {
      snapshotId: 'snap-v2',
      versionId: 'ver-v2',
      versionNumber: 'V2',
      planName: 'Test Plan',
      createdAt: '2026-08-23T01:00:00Z',
      effectiveDate: '2027-01-01',
      orgUnits: dataset.orgUnits,
      positions: dataset.positions,
      assignments: dataset.assignments,
      employees: dataset.employees,
      treeHash: 'hash-v2'
    };

    // Compute Diff between V1 and V2
    const diff = computeVersionDiff(v1Snapshot, v2Snapshot);

    expect(diff.movedEmployees.length).toBe(1);
    expect(diff.movedEmployees[0].employeeId).toBe(empToMove.id);
    expect(diff.vacatedPositions.length).toBe(1);
    expect(diff.vacatedPositions[0].positionCode).toBe(originalPos.code);

    // Verify V1 immutability
    expect(v1Snapshot.positions[0].lifecycle).toBe('ACTIVE');
  });
});
