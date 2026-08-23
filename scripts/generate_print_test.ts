import fs from 'fs';
import path from 'path';
import { generateA3OrganizationChartPDF } from '../packages/domain/src/pdfPrint.js';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';

async function main() {
  console.log('Building canonical domain dataset...');
  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  console.log(`Loaded ${dataset.orgUnits.length} Org Units, ${dataset.positions.length} Positions, ${dataset.employees.length} Employees`);

  console.log('Generating A3 Vector PDF...');
  const pdfBytes = await generateA3OrganizationChartPDF(
    dataset.orgUnits,
    dataset.positions,
    dataset.assignments,
    dataset.employees,
    {
      planName: 'Toyota Tsusho M&E (Thailand) Co.,Ltd. Organization Chart',
      versionNumber: 'Rev. 2 / 2026',
      effectiveDate: '5 May 2026',
      documentId: 'OFS-A3-FY2026-REV2',
      preparedBy: 'HR & Personnel Department (TMH2)',
      reviewedBy: 'Ms. Chvitsara (Corporate Dept GM)',
      approvedBy: 'Mr. Takeshi Tsuchihira (Managing Director)'
    }
  );

  const outDir = path.resolve('org data/generated');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPdfPath = path.join(outDir, 'OrgFlow_A3_Organization_Chart_Official.pdf');
  fs.writeFileSync(outPdfPath, pdfBytes);
  console.log(`[SUCCESS] A3 Organization Chart PDF generated at:\n${outPdfPath} (${pdfBytes.length} bytes)`);
}

main().catch(err => {
  console.error('[ERROR] Failed to generate PDF:', err);
  process.exit(1);
});
