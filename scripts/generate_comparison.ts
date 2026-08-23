import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';

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
  console.log(`Rendered ${pdfPath} to ${outPngPath} (${viewport.width}x${viewport.height})`);
  return { width: viewport.width, height: viewport.height, buffer };
}

async function main() {
  const compDir = path.resolve('org data/generated/comparison');
  if (!fs.existsSync(compDir)) {
    fs.mkdirSync(compDir, { recursive: true });
  }

  const refPdf = path.resolve('org data/reference/Org.FY2026_Rev.2.pdf');
  const genPdf = path.resolve('org data/generated/OrgFlow_A3_Organization_Chart_Official.pdf');

  const refPng = path.join(compDir, 'reference.png');
  const genPng = path.join(compDir, 'generated.png');
  const sideBySidePng = path.join(compDir, 'side_by_side.png');
  const overlayPng = path.join(compDir, 'overlay.png');

  console.log('Rendering reference PDF page...');
  await renderPdfPageToPng(refPdf, refPng, 1.5);

  console.log('Rendering generated PDF page...');
  await renderPdfPageToPng(genPdf, genPng, 1.5);

  const targetW = 1200;
  const targetH = Math.round((842.4 / 1191.6) * 1200); // ~848

  const refResized = await sharp(refPng).resize(targetW, targetH).toBuffer();
  const genResized = await sharp(genPng).resize(targetW, targetH).toBuffer();

  // 1. Side-by-Side Comparison
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
    .toFile(sideBySidePng);

  console.log(`[SUCCESS] Side-by-side visual comparison generated at:\n${sideBySidePng}`);

  // 2. Semi-Transparent Overlay Comparison (50% opacity blend)
  const genSemiTransparent = await sharp(genResized)
    .ensureAlpha(0.5)
    .toBuffer();

  await sharp(refResized)
    .composite([{ input: genSemiTransparent, blend: 'over' }])
    .png()
    .toFile(overlayPng);

  console.log(`[SUCCESS] Overlay visual comparison generated at:\n${overlayPng}`);
}

main().catch(err => {
  console.error('[ERROR] Failed comparison generation:', err);
  process.exit(1);
});
