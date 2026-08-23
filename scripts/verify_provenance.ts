import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';
import { resolveChartVisibility } from '../packages/domain/src/displayPolicy.js';

function verifyProvenance() {
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  console.log('=== 5 SAMPLE PROVENANCE CHECKS ===');

  const sampleEmpCodes = ['EMP-001', 'EMP-002', 'EMP-004', 'EMP-015', 'EMP-024'];

  sampleEmpCodes.forEach(code => {
    const emp = dataset.employees.find(e => e.employeeCode === code);
    if (!emp) {
      console.error(`Employee ${code} not found!`);
      return;
    }

    const asg = dataset.assignments.find(a => a.employeeId === emp.id);
    const pos = asg ? dataset.positions.find(p => p.id === asg.positionId) : null;
    const org = pos ? dataset.orgUnits.find(o => o.code === pos.orgUnitCode) : null;
    const res = pos ? resolveChartVisibility({ position: pos, orgUnit: org }) : null;

    console.log(`\n[PROVENANCE] Employee: ${emp.nameEN} (${emp.employeeCode}) [${emp.nameTH}]`);
    console.log(`  └─ Primary Assignment ID: ${asg?.id} (isPrimary: ${asg?.isPrimary})`);
    console.log(`  └─ Position: [${pos?.code}] ${pos?.title} (Lifecycle: ${pos?.lifecycle})`);
    console.log(`  └─ Org Unit: [${org?.code}] ${org?.name} (L${org?.level} • ${org?.type})`);
    console.log(`  └─ Chart Visibility: ${res?.visible ? 'SHOW' : 'HIDE'} (Source: ${res?.source} | Reason: ${res?.reason})`);
  });
}

verifyProvenance();
