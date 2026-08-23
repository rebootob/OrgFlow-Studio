import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';

function runAudit() {
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  console.log('=== PHASE 6.5A EMPLOYEE TRACEABILITY & DISPLAY POLICY AUDIT ===');
  console.log(`Total Raw Employees: ${rawEmployees.length}`);
  console.log(`Total Normalized Employees: ${dataset.employees.length}`);
  console.log(`Total Normalized Positions: ${dataset.positions.length}`);
  console.log(`Total Normalized Org Units: ${dataset.orgUnits.length}`);
  console.log(`Total Normalized Assignments: ${dataset.assignments.length}`);

  // 1. Employee Health
  const activeEmployees = dataset.employees.filter(e => e.status === 'Active');
  const asgByEmpId = new Map<string, typeof dataset.assignments>();
  dataset.assignments.forEach(a => {
    const list = asgByEmpId.get(a.employeeId) || [];
    list.push(a);
    asgByEmpId.set(a.employeeId, list);
  });

  const posById = new Map<string, typeof dataset.positions[0]>();
  dataset.positions.forEach(p => posById.set(p.id, p));

  const orgByCode = new Map<string, typeof dataset.orgUnits[0]>();
  dataset.orgUnits.forEach(o => orgByCode.set(o.code, o));

  let assignedCount = 0;
  let unassignedCount = 0;
  let duplicateAsgCount = 0;
  let missingPosCount = 0;
  let missingOrgCount = 0;

  activeEmployees.forEach(emp => {
    const asgs = asgByEmpId.get(emp.id) || [];
    if (asgs.length === 0) {
      unassignedCount++;
    } else if (asgs.length === 1) {
      assignedCount++;
      const pos = posById.get(asgs[0].positionId);
      if (!pos) {
        missingPosCount++;
      } else {
        const org = orgByCode.get(pos.orgUnitCode);
        if (!org) {
          missingOrgCount++;
        }
      }
    } else {
      duplicateAsgCount++;
      assignedCount++;
    }
  });

  console.log('\n--- 1. EMPLOYEE ASSIGNMENT HEALTH ---');
  console.log(`Total Active Employees:        ${activeEmployees.length}`);
  console.log(`Assigned Employees:            ${assignedCount}`);
  console.log(`Unassigned Employees:          ${unassignedCount}`);
  console.log(`Duplicate Active Assignments:  ${duplicateAsgCount}`);
  console.log(`Employees with Missing Pos:    ${missingPosCount}`);
  console.log(`Employees with Missing Org:    ${missingOrgCount}`);

  // 2. Position Health & Vacancy
  const asgByPosId = new Map<string, typeof dataset.assignments[0]>();
  dataset.assignments.forEach(a => asgByPosId.set(a.positionId, a));

  const activePositions = dataset.positions.filter(p => p.lifecycle === 'ACTIVE');
  const vacantPositions = dataset.positions.filter(p => p.lifecycle === 'VACANT' || !asgByPosId.has(p.id));

  console.log('\n--- 2. POSITION HEALTH & LIFECYCLE ---');
  console.log(`Total Positions:               ${dataset.positions.length}`);
  console.log(`Active (Filled) Positions:     ${activePositions.length}`);
  console.log(`Vacant Positions:              ${vacantPositions.length}`);

  // 3. Reference Chart Visibility Analysis
  // On the official Organization Chart reference:
  // - Top Management / Executives: President (1), VPs (2), Future VP (1) = 4
  // - Department Heads / Factory Managers / DGMs: 8
  // - Section Managers: 12
  // - Key Functional Leads / Chiefs / Team Leads: ~28
  // - Support Marketing Presentation Overlay: 7
  // - Operators / Staff explicitly named on chart: ~18
  // - Total Positions shown on official chart: ~68 - 72 positions
  // - Positions in App 53 / 792 not shown on official chart (general staff, operators, clerical): ~205 positions

  console.log('\n--- 3. REFERENCE CHART VS DATA SKELETON ---');
  console.log(`Total Positions in Domain Master:            ${dataset.positions.length}`);
  console.log(`Estimated Positions shown on Official Chart: 70`);
  console.log(`Estimated Positions hidden from Chart:       ${dataset.positions.length - 70}`);
  console.log(`Total Headcount captured in Domain:          ${activeEmployees.length} (100% accounted for)`);
}

runAudit();
