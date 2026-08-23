import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import { generateA3OrganizationChartPDF } from '../packages/domain/src/pdfPrint.js';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { buildNormalizedDataset } from '../packages/domain/src/normalizer.js';

async function renderPdfPageToPng(pdfPath: string, outPngPath: string, scale: number = 2.0) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const renderContext = {
    canvasContext: ctx as any,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPngPath, buffer);
  return { width: viewport.width, height: viewport.height, buffer };
}

function getSha256(filePath: string): string {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function main() {
  const timestamp = '20260823_1416';
  const genDir = path.resolve('org data/generated');
  const compDir = path.resolve('org data/generated/comparison');

  if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true });
  if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });

  const rawEmployees = generate275EmployeesFixture();
  const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

  console.log(`[DATASET] ${dataset.orgUnits.length} Org Units, ${dataset.positions.length} Positions, ${dataset.employees.length} Employees`);

  const verifyPdfPath = path.join(genDir, `OrgFlow_A3_Organization_Chart_VERIFY_${timestamp}.pdf`);
  const officialPdfPath = path.join(genDir, `OrgFlow_A3_Organization_Chart_Official.pdf`);
  const refPdfPath = path.resolve('org data/reference/Org.FY2026_Rev.2.pdf');

  const oldHash = getSha256(officialPdfPath);

  console.log('Generating new timestamped VERIFY PDF from current domain/print engine...');
  const pdfBytes = await generateA3OrganizationChartPDF(
    dataset.orgUnits,
    dataset.positions,
    dataset.assignments,
    dataset.employees,
    {
      planName: 'Toyota Tsusho M&E (Thailand) Co.,Ltd. Organization Chart',
      versionNumber: 'Rev. 2 / 2026',
      effectiveDate: '5 May 2026',
      documentId: `OFS-A3-VERIFY-${timestamp}`,
      preparedBy: 'HR & Personnel Department (TMH2)',
      reviewedBy: 'Ms. Chvitsara (Corporate Dept GM)',
      approvedBy: 'Mr. Takeshi Tsuchihira (Managing Director)'
    }
  );

  fs.writeFileSync(verifyPdfPath, pdfBytes);
  const newHash = getSha256(verifyPdfPath);
  const stats = fs.statSync(verifyPdfPath);

  console.log(`[VERIFY PDF CREATED] ${verifyPdfPath}`);
  console.log(`Size: ${stats.size} bytes`);
  console.log(`Modified: ${stats.mtime.toISOString()}`);
  console.log(`Old SHA-256 (Official): ${oldHash}`);
  console.log(`New SHA-256 (VERIFY):   ${newHash}`);

  // Generate comparison PNGs
  const refPngPath = path.join(compDir, `reference_VERIFY_${timestamp}.png`);
  const genPngPath = path.join(compDir, `generated_VERIFY_${timestamp}.png`);
  const sideBySidePath = path.join(compDir, `side_by_side_VERIFY_${timestamp}.png`);
  const overlayPath = path.join(compDir, `overlay_VERIFY_${timestamp}.png`);

  console.log('Rendering reference and verify PNGs...');
  await renderPdfPageToPng(refPdfPath, refPngPath, 1.5);
  await renderPdfPageToPng(verifyPdfPath, genPngPath, 1.5);

  const targetW = 1200;
  const targetH = Math.round((842.4 / 1191.6) * 1200); // ~848

  const refResized = await sharp(refPngPath).resize(targetW, targetH).toBuffer();
  const genResized = await sharp(genPngPath).resize(targetW, targetH).toBuffer();

  await sharp({
    create: {
      width: targetW * 2 + 40,
      height: targetH + 60,
      channels: 4,
      background: { r: 240, g: 243, b: 246, alpha: 1 }
    }
  })
    .composite([
      { input: refResized, left: 15, top: 40 },
      { input: genResized, left: targetW + 25, top: 40 }
    ])
    .png()
    .toFile(sideBySidePath);

  console.log(`[SIDE BY SIDE CREATED] ${sideBySidePath}`);

  const genSemiTransparent = await sharp(genResized)
    .ensureAlpha(0.5)
    .toBuffer();

  await sharp(refResized)
    .composite([{ input: genSemiTransparent, blend: 'over' }])
    .png()
    .toFile(overlayPath);

  console.log(`[OVERLAY CREATED] ${overlayPath}`);
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
