import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';
import { buildPositionDisplayMatrix } from '../packages/domain/src/displayPolicy.js';

function auditCalibration() {
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  const matrix = buildPositionDisplayMatrix(
    dataset.positions,
    dataset.orgUnits,
    dataset.employees,
    dataset.assignments
  );

  console.log('=== CALIBRATION AUDIT OF 275 POSITIONS ===');

  const visibleRows = matrix.filter(r => r.resolvedVisible);
  const hiddenRows = matrix.filter(r => !r.resolvedVisible);

  console.log(`Total Positions: ${matrix.length}`);
  console.log(`Currently Visible: ${visibleRows.length}`);
  console.log(`Currently Hidden: ${hiddenRows.length}`);

  // Group visible positions by Org Unit Level
  const visibleByLevel = new Map<number, typeof visibleRows>();
  visibleRows.forEach(r => {
    const list = visibleByLevel.get(r.orgUnitLevel) || [];
    list.push(r);
    visibleByLevel.set(r.orgUnitLevel, list);
  });

  console.log('\n--- VISIBLE POSITIONS BY ORG UNIT LEVEL ---');
  Array.from(visibleByLevel.keys()).sort().forEach(lvl => {
    const list = visibleByLevel.get(lvl)!;
    console.log(`Level ${lvl}: ${list.length} positions`);
    list.slice(0, 5).forEach(r => {
      console.log(`   [${r.positionCode}] ${r.positionTitle} (${r.orgUnitCode}: ${r.orgUnitName}) -> ${r.source}: ${r.reason}`);
    });
    if (list.length > 5) {
      console.log(`   ... and ${list.length - 5} more`);
    }
  });
}

auditCalibration();
