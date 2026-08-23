import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';
import { buildPositionDisplayMatrix } from '../packages/domain/src/displayPolicy.js';

function computeBreakdown() {
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  const matrix = buildPositionDisplayMatrix(
    dataset.positions,
    dataset.orgUnits,
    dataset.employees,
    dataset.assignments
  );

  let autoShow = 0;
  let autoHide = 0;
  let explicitShow = 0;
  let explicitHide = 0;
  let presMapping = 0;

  matrix.forEach(row => {
    if (row.source === 'PRESENTATION_MAPPING') presMapping++;
    else if (row.source === 'AUTO_RULE' && row.resolvedVisible) autoShow++;
    else if (row.source === 'AUTO_RULE' && !row.resolvedVisible) autoHide++;
    else if (row.source === 'EXPLICIT_SHOW') explicitShow++;
    else if (row.source === 'EXPLICIT_HIDE') explicitHide++;
  });

  const totalVisible = matrix.filter(r => r.resolvedVisible).length;
  const totalHidden = matrix.filter(r => !r.resolvedVisible).length;

  console.log(`TOTAL POSITIONS: ${matrix.length}`);
  console.log(`TOTAL VISIBLE:   ${totalVisible} (Presentation Mapping: ${presMapping}, Auto-Rule: ${autoShow}, Explicit: ${explicitShow})`);
  console.log(`TOTAL HIDDEN:    ${totalHidden} (Auto-Rule: ${autoHide}, Explicit: ${explicitHide})`);
}

computeBreakdown();
