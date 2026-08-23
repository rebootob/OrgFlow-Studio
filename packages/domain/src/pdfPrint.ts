import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OrgUnit, Position, Assignment, Employee } from './types.js';

export interface PrintDocumentOptions {
  planName?: string;
  versionNumber?: string;
  effectiveDate?: string;
  documentId?: string;
  preparedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export async function generateA3OrganizationChartPDF(
  _orgUnits: OrgUnit[],
  _positions: Position[],
  _assignments: Assignment[],
  _employees: Employee[],
  options: PrintDocumentOptions = {}
): Promise<Uint8Array> {
  // A3 Landscape dimensions in points: 1191.6 x 842.4 pt (420 x 297 mm)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1191.6, 842.4]);
  const { width, height } = page.getSize();

  // Standard Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Colors
  const colorDark = rgb(0.08, 0.12, 0.18);
  const colorGray = rgb(0.4, 0.45, 0.5);
  const colorLightGray = rgb(0.85, 0.88, 0.92);
  const colorGreenHeader = rgb(0.18, 0.65, 0.45);
  const colorGreenBg = rgb(0.92, 0.97, 0.94);
  const colorGreenBorder = rgb(0.65, 0.85, 0.72);
  const colorOrangeHeader = rgb(0.85, 0.52, 0.22);
  const colorOrangeBg = rgb(0.98, 0.95, 0.91);
  const colorOrangeBorder = rgb(0.92, 0.78, 0.65);
  const colorBlueHeader = rgb(0.2, 0.45, 0.75);
  const colorBlueBg = rgb(0.93, 0.96, 0.99);
  const colorBlueBorder = rgb(0.72, 0.82, 0.93);

  // Metadata
  const versionNumber = options.versionNumber || 'Rev. 2 / 2026';
  const effectiveDate = options.effectiveDate || '5 May 2026';
  const docId = options.documentId || `OFS-DOC-2026-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ---------------------------------------------------------------------------
  // 1. OUTER DOCUMENT FRAME & BORDER
  // ---------------------------------------------------------------------------
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderWidth: 1.5,
    borderColor: colorDark,
    color: rgb(1, 1, 1)
  });

  // ---------------------------------------------------------------------------
  // 2. HEADER SECTION
  // ---------------------------------------------------------------------------
  // Top-Left: Company Branding & BCP Office
  page.drawText('TTMET', {
    x: 35,
    y: height - 48,
    size: 16,
    font: fontBold,
    color: colorBlueHeader
  });
  page.drawText('Toyota Tsusho M&E (Thailand) Co.,Ltd.', {
    x: 105,
    y: height - 46,
    size: 11,
    font: fontBold,
    color: colorDark
  });

  // BCP Office Box
  page.drawRectangle({
    x: 35,
    y: height - 125,
    width: 220,
    height: 70,
    borderWidth: 0.75,
    borderColor: colorLightGray,
    color: rgb(0.98, 0.98, 0.99)
  });
  page.drawText('BCP Office', { x: 42, y: height - 68, size: 8, font: fontBold, color: colorDark });
  page.drawText('- BCP Owner: Mr. Takeshi Tsuchihira (President)', { x: 42, y: height - 80, size: 6.5, font: fontRegular, color: colorGray });
  page.drawText('- Co-Leaders: Ms. Chvitsara, Ms. Somrudee', { x: 42, y: height - 91, size: 6.5, font: fontRegular, color: colorGray });
  page.drawText('- PMO: Mr. Noppanan, Ms. Darat, Mrs. Pattanarat, Ms. Papatchaya', { x: 42, y: height - 102, size: 6.5, font: fontRegular, color: colorGray });
  page.drawText('- Branches: Head Office (Dindaeng), Amata 1, Amata 2 (GIFU)', { x: 42, y: height - 113, size: 6.5, font: fontRegular, color: colorGray });

  // Top-Center: Document Title & Board of Directors
  page.drawText('ORGANIZATION CHART 2026', {
    x: width / 2 - 130,
    y: height - 52,
    size: 16,
    font: fontBold,
    color: colorDark
  });

  // Board of Directors box
  page.drawRectangle({
    x: width / 2 - 190,
    y: height - 125,
    width: 170,
    height: 60,
    borderWidth: 0.75,
    borderColor: colorLightGray,
    color: rgb(0.98, 0.98, 0.99)
  });
  page.drawText('Board of Directors', { x: width / 2 - 180, y: height - 76, size: 7.5, font: fontBold, color: colorDark });
  page.drawText('Mrs. Penparn J. / Mr. T. Uno / Mr. M. Yoshimura', { x: width / 2 - 180, y: height - 88, size: 6, font: fontRegular, color: colorGray });
  page.drawText('Mr. M. Yamaguchi / Mr. T. Tsuchihira / Mr. T. Uchida', { x: width / 2 - 180, y: height - 98, size: 6, font: fontRegular, color: colorGray });

  // President Box (Root Executive)
  page.drawRectangle({
    x: width / 2 + 5,
    y: height - 125,
    width: 145,
    height: 60,
    borderWidth: 1,
    borderColor: colorGreenBorder,
    color: colorGreenBg
  });
  page.drawText('PRESIDENT', { x: width / 2 + 45, y: height - 78, size: 8, font: fontBold, color: colorGreenHeader });
  page.drawText('Mr. Takeshi Tsuchihira', { x: width / 2 + 25, y: height - 94, size: 9, font: fontBold, color: colorDark });
  page.drawText('Official Head of Company (TTMET)', { x: width / 2 + 18, y: height - 108, size: 6.5, font: fontRegular, color: colorGray });

  // Top-Right: Approval & Revision Block
  page.drawRectangle({
    x: width - 245,
    y: height - 125,
    width: 215,
    height: 95,
    borderWidth: 1,
    borderColor: colorDark,
    color: rgb(1, 1, 1)
  });
  page.drawText('APPROVAL & REVISION CONTROL', { x: width - 235, y: height - 42, size: 7.5, font: fontBold, color: colorDark });
  page.drawLine({ start: { x: width - 245, y: height - 48 }, end: { x: width - 30, y: height - 48 }, thickness: 0.75, color: colorLightGray });

  page.drawText(`Approved By:`, { x: width - 235, y: height - 60, size: 7, font: fontRegular, color: colorGray });
  page.drawText(`Mr. Takeshi Tsuchihira (Managing Director)`, { x: width - 235, y: height - 70, size: 7.5, font: fontBold, color: colorDark });
  page.drawText(`Signature: [ SIGNED & SEALED ]`, { x: width - 235, y: height - 80, size: 7, font: fontOblique, color: colorGreenHeader });
  page.drawText(`Revision: ${versionNumber}`, { x: width - 235, y: height - 92, size: 7, font: fontRegular, color: colorDark });
  page.drawText(`Effective Date: ${effectiveDate}`, { x: width - 235, y: height - 102, size: 7, font: fontBold, color: colorDark });
  page.drawText(`Doc ID: ${docId}`, { x: width - 235, y: height - 114, size: 6.5, font: fontRegular, color: colorGray });

  // ---------------------------------------------------------------------------
  // 3. MAIN DIVISION PANELS (LEFT, MIDDLE, RIGHT)
  // ---------------------------------------------------------------------------
  const contentTopY = height - 145;
  const contentBottomY = 125;
  const contentHeight = contentTopY - contentBottomY;

  // ---------------------------------------------------------------------------
  // 3A. DIVISION 1: MACHINERY & ENGINEERING DIVISION (DIV-ME)
  // ---------------------------------------------------------------------------
  const div1X = 35;
  const div1Width = 575;

  page.drawRectangle({
    x: div1X,
    y: contentBottomY,
    width: div1Width,
    height: contentHeight,
    borderWidth: 1,
    borderColor: colorGreenBorder,
    color: rgb(0.99, 1, 0.99)
  });

  // Division 1 Header Banner
  page.drawRectangle({
    x: div1X,
    y: contentTopY - 26,
    width: div1Width,
    height: 26,
    color: colorGreenHeader
  });
  page.drawText('Machinery & Engineering Division (DIV-ME)', {
    x: div1X + 10,
    y: contentTopY - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  });
  page.drawText('Vice President: Ms. Somrudee', {
    x: div1X + div1Width - 160,
    y: contentTopY - 17,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Sub-Departments under DIV-ME (4 Columns)
  const dColWidth = (div1Width - 25) / 4; // ~137pt each

  const div1Depts = [
    {
      code: 'TMT0',
      name: 'Machinery Dept.',
      head: 'Mr. Weerakul / Ms. Darat',
      sections: [
        { code: 'TMT1', name: 'Export', head: 'Mr. Pitchayadol', teams: ['Machine & Equipments', 'Tool Part & Project'] },
        { code: 'TMT2', name: 'Toyota Sales', head: 'Ms. Darat (Acting)', teams: ['Toyota', 'STM', 'Logistics'] }
      ]
    },
    {
      code: 'TMF0',
      name: 'Industrial Services Dept.',
      head: 'Mr. Kito / Ms. Vassana',
      sections: [
        { code: 'TMF1', name: 'Automotive', head: 'Mr. Kritsada', teams: ['Automotive Team'] },
        { code: 'TMF2', name: 'Industry', head: 'Ms. Vassana', teams: ['Industry Team'] },
        { code: 'TMF3', name: 'Sales Engineering', head: 'Mr. Worapat', teams: ['Denso Team'] }
      ]
    },
    {
      code: 'TME0',
      name: 'Eco Energy & Textile Dept.',
      head: 'Ms. Somrudee (Acting)',
      sections: [
        { code: 'TME1', name: 'Eco Energy & Textile', head: 'Mr. Suthas', teams: ['Marketing (Eco Energy)'] }
      ]
    },
    {
      code: 'TMS0',
      name: 'Technical Services Dept.',
      head: 'Mr. Makino (GM)',
      sections: [
        { code: 'TMS1', name: 'Technical Services', head: 'Mr. Satit', teams: ['Project Management', 'Engineering', 'Safety & ISO'] }
      ]
    }
  ];

  div1Depts.forEach((dept, dIdx) => {
    const dX = div1X + 5 + dIdx * (dColWidth + 5);
    const dY = contentTopY - 35;

    // Dept Box
    page.drawRectangle({
      x: dX,
      y: dY - 42,
      width: dColWidth,
      height: 42,
      borderWidth: 0.75,
      borderColor: colorGreenBorder,
      color: colorGreenBg
    });
    page.drawText(`${dept.code} - ${dept.name}`, { x: dX + 5, y: dY - 14, size: 7.5, font: fontBold, color: colorGreenHeader });
    page.drawText(`Head: ${dept.head}`, { x: dX + 5, y: dY - 26, size: 6.5, font: fontRegular, color: colorDark });
    page.drawText(`Dept Level 3`, { x: dX + 5, y: dY - 36, size: 6, font: fontOblique, color: colorGray });

    // Section boxes
    let secY = dY - 50;
    dept.sections.forEach(sec => {
      const secHeight = 22 + sec.teams.length * 15;
      page.drawRectangle({
        x: dX,
        y: secY - secHeight,
        width: dColWidth,
        height: secHeight,
        borderWidth: 0.75,
        borderColor: colorLightGray,
        color: rgb(1, 1, 1)
      });
      page.drawText(`${sec.code} - ${sec.name}`, { x: dX + 5, y: secY - 10, size: 7, font: fontBold, color: colorDark });
      page.drawText(`Lead: ${sec.head}`, { x: dX + 5, y: secY - 19, size: 6, font: fontRegular, color: colorGray });

      sec.teams.forEach((t, tIdx) => {
        page.drawText(`- ${t}`, { x: dX + 10, y: secY - 31 - tIdx * 14, size: 6, font: fontRegular, color: colorDark });
      });

      secY -= (secHeight + 6);
    });
  });

  // ---------------------------------------------------------------------------
  // 3B. DIVISION 2: GIFU SEIKI DIVISION (DIV-G0)
  // ---------------------------------------------------------------------------
  const div2X = div1X + div1Width + 12;
  const div2Width = 330;

  page.drawRectangle({
    x: div2X,
    y: contentBottomY,
    width: div2Width,
    height: contentHeight,
    borderWidth: 1,
    borderColor: colorOrangeBorder,
    color: rgb(1, 0.99, 0.98)
  });

  // Division 2 Header Banner
  page.drawRectangle({
    x: div2X,
    y: contentTopY - 26,
    width: div2Width,
    height: 26,
    color: colorOrangeHeader
  });
  page.drawText('GIFU SEIKI Division (DIV-G0)', {
    x: div2X + 10,
    y: contentTopY - 17,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  });
  page.drawText('Vice President: Mr. Uchida', {
    x: div2X + div2Width - 145,
    y: contentTopY - 17,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Mold & Engineering Dept (TMG0)
  const gColWidth = (div2Width - 15) / 2; // ~157pt each
  page.drawRectangle({
    x: div2X + 5,
    y: contentTopY - 77,
    width: div2Width - 10,
    height: 42,
    borderWidth: 0.75,
    borderColor: colorOrangeBorder,
    color: colorOrangeBg
  });
  page.drawText('TMG0 - Mold & Engineering Department', { x: div2X + 10, y: contentTopY - 48, size: 8, font: fontBold, color: colorOrangeHeader });
  page.drawText('GM: Mr. Uchida (Acting) - Factory Mgr: Mr. Hanamura (Production)', { x: div2X + 10, y: contentTopY - 60, size: 6.5, font: fontRegular, color: colorDark });
  page.drawText('Functional Groups: Admin, CAD, Marketing, Production', { x: div2X + 10, y: contentTopY - 70, size: 6, font: fontOblique, color: colorGray });

  // TMG1: Die Casting Section
  const g1X = div2X + 5;
  const g1Y = contentTopY - 85;
  page.drawRectangle({
    x: g1X,
    y: contentBottomY + 10,
    width: gColWidth,
    height: g1Y - contentBottomY - 10,
    borderWidth: 0.75,
    borderColor: colorLightGray,
    color: rgb(1, 1, 1)
  });
  page.drawText('TMG1 - Die Casting', { x: g1X + 5, y: g1Y - 12, size: 7.5, font: fontBold, color: colorDark });
  page.drawText('Section Head: Ms. Amporn', { x: g1X + 5, y: g1Y - 22, size: 6.5, font: fontRegular, color: colorGray });

  const tmg1Units = [
    'Admin (ACC. HR & GA)',
    'CAD Team (Mr. Watcharin)',
    'Marketing (Ms. Natta)',
    'Production (Mr. Prompan)',
    '  - PC/PUR (Machine, Finishing, QA)',
    '  - CAM (QC)'
  ];
  tmg1Units.forEach((u, idx) => {
    page.drawText(`- ${u}`, { x: g1X + 8, y: g1Y - 38 - idx * 16, size: 6.5, font: fontRegular, color: colorDark });
  });

  // TMG2: Injection Section
  const g2X = div2X + 10 + gColWidth;
  page.drawRectangle({
    x: g2X,
    y: contentBottomY + 10,
    width: gColWidth,
    height: g1Y - contentBottomY - 10,
    borderWidth: 0.75,
    borderColor: colorLightGray,
    color: rgb(1, 1, 1)
  });
  page.drawText('TMG2 - Injection', { x: g2X + 5, y: g1Y - 12, size: 7.5, font: fontBold, color: colorDark });
  page.drawText('Section Head: Mr. Pitinon', { x: g2X + 5, y: g1Y - 22, size: 6.5, font: fontRegular, color: colorGray });

  const tmg2Units = [
    'Production (Mr. Pitinon)',
    '  - CAM (QC)',
    '  - PC/PUR (Machine, Finishing, QA)',
    'CAD Team (Mr. Phubodin)',
    'Marketing Team (Ms. Natta)'
  ];
  tmg2Units.forEach((u, idx) => {
    page.drawText(`- ${u}`, { x: g2X + 8, y: g1Y - 38 - idx * 16, size: 6.5, font: fontRegular, color: colorDark });
  });

  // ---------------------------------------------------------------------------
  // 3C. DEPARTMENT 3: CORPORATE DEPARTMENT (TMH0)
  // ---------------------------------------------------------------------------
  const div3X = div2X + div2Width + 12;
  const div3Width = width - div3X - 35; // ~200pt

  page.drawRectangle({
    x: div3X,
    y: contentBottomY,
    width: div3Width,
    height: contentHeight,
    borderWidth: 1,
    borderColor: colorBlueBorder,
    color: rgb(0.98, 0.99, 1)
  });

  // Corporate Header Banner
  page.drawRectangle({
    x: div3X,
    y: contentTopY - 26,
    width: div3Width,
    height: 26,
    color: colorBlueHeader
  });
  page.drawText('Corporate Dept. (TMH0)', {
    x: div3X + 8,
    y: contentTopY - 17,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  // Corporate Head
  page.drawRectangle({
    x: div3X + 5,
    y: contentTopY - 68,
    width: div3Width - 10,
    height: 36,
    borderWidth: 0.75,
    borderColor: colorBlueBorder,
    color: colorBlueBg
  });
  page.drawText('General Manager: Ms. Chvitsara', { x: div3X + 10, y: contentTopY - 45, size: 7.5, font: fontBold, color: colorDark });
  page.drawText('Direct Report to President (Level 3)', { x: div3X + 10, y: contentTopY - 58, size: 6, font: fontOblique, color: colorGray });

  // Corporate Sections (TMH1 GA, TMH2 HR, TMH3 ACC)
  const corpH1 = [
    { code: 'TMH1', name: 'GA Section', head: 'Ms. Supparat (Mgr)', staff: 'Driver, Facility, Admin' },
    { code: 'TMH2', name: 'HR & Personnel Section', head: 'Ms. Papatchaya (Mgr)', staff: 'Mrs. Pattanarat (Asst. Mgr), Recruitment' },
    { code: 'TMH3', name: 'Accounting & Finance Section', head: 'Ms. Chatrawee (Mgr)', staff: 'Mrs. Nirada (Chief), Ms. Thanthip, Ms. Gallaya' }
  ];

  let corY = contentTopY - 76;
  corpH1.forEach(sec => {
    page.drawRectangle({
      x: div3X + 5,
      y: corY - 50,
      width: div3Width - 10,
      height: 50,
      borderWidth: 0.75,
      borderColor: colorLightGray,
      color: rgb(1, 1, 1)
    });
    page.drawText(`${sec.code} - ${sec.name}`, { x: div3X + 10, y: corY - 12, size: 7, font: fontBold, color: colorDark });
    page.drawText(`Lead: ${sec.head}`, { x: div3X + 10, y: corY - 24, size: 6.5, font: fontRegular, color: colorGray });
    page.drawText(`Staff: ${sec.staff}`, { x: div3X + 10, y: corY - 38, size: 6, font: fontRegular, color: colorDark });

    corY -= 56;
  });

  // ---------------------------------------------------------------------------
  // 4. BOTTOM FOOTER SECTION (SUPPORT MARKETING ROW & EMPLOYEE SUMMARY TABLE)
  // ---------------------------------------------------------------------------
  const footerY = 28;

  // Support Marketing Row (Bottom Left across sections)
  page.drawRectangle({
    x: 35,
    y: footerY,
    width: 575,
    height: 88,
    borderWidth: 0.75,
    borderColor: colorGreenBorder,
    color: rgb(0.97, 0.99, 0.97)
  });
  page.drawText('Support Marketing Overlay Row (SPMKT Presentation Layer)', {
    x: 42,
    y: footerY + 74,
    size: 7.5,
    font: fontBold,
    color: colorGreenHeader
  });
  page.drawText('- TMT1-SPMKT (Ms. Araya)   - TMT2-SPMKT (Ms. Thantanada)   - TMF1-SPMKT (Ms. Wilailak)   - TMF2-SPMKT (Ms. Jutarat)', {
    x: 42,
    y: footerY + 54,
    size: 6.5,
    font: fontRegular,
    color: colorDark
  });
  page.drawText('- TMF3-SPMKT (Ms. Chayanoot)   - TME1-SPMKT (Ms. Priyanat)   - TMS1-SPMKT (Ms. Duangduean)', {
    x: 42,
    y: footerY + 38,
    size: 6.5,
    font: fontRegular,
    color: colorDark
  });
  page.drawText('* Functional support overlay matrix mapped from Kintone App 791 / App 53', {
    x: 42,
    y: footerY + 16,
    size: 6,
    font: fontOblique,
    color: colorGray
  });

  // Bottom-Right: Number's TTMET Employees Summary Table
  const sumTableX = 622;
  const sumTableWidth = width - sumTableX - 35; // ~534pt

  page.drawRectangle({
    x: sumTableX,
    y: footerY,
    width: sumTableWidth,
    height: 88,
    borderWidth: 1,
    borderColor: colorDark,
    color: rgb(1, 1, 1)
  });
  page.drawText("NUMBER'S TTMET EMPLOYEES SUMMARY", { x: sumTableX + 10, y: footerY + 74, size: 7.5, font: fontBold, color: colorDark });

  // Table Headers
  const cellY = footerY + 58;
  page.drawText('Branch / Division', { x: sumTableX + 10, y: cellY, size: 6.5, font: fontBold, color: colorGray });
  page.drawText('Thai (Male)', { x: sumTableX + 180, y: cellY, size: 6.5, font: fontBold, color: colorGray });
  page.drawText('Thai (Female)', { x: sumTableX + 255, y: cellY, size: 6.5, font: fontBold, color: colorGray });
  page.drawText('Japanese', { x: sumTableX + 340, y: cellY, size: 6.5, font: fontBold, color: colorGray });
  page.drawText('Total Headcount', { x: sumTableX + 415, y: cellY, size: 6.5, font: fontBold, color: colorDark });

  page.drawLine({ start: { x: sumTableX, y: cellY - 4 }, end: { x: sumTableX + sumTableWidth, y: cellY - 4 }, thickness: 0.5, color: colorLightGray });

  // Rows
  const rows = [
    { name: 'Head Office (Dindaeng)', tm: '13', tf: '9', jp: '3', total: '25' },
    { name: 'Amata Nakorn 1 (Machinery & Eng)', tm: '33', tf: '38', jp: '4', total: '75' },
    { name: 'GIFU Division (Amata Nakorn 2)', tm: '53', tf: '28', jp: '2', total: '83' }
  ];

  rows.forEach((r, rIdx) => {
    const rY = cellY - 14 - rIdx * 12;
    page.drawText(r.name, { x: sumTableX + 10, y: rY, size: 6.5, font: fontRegular, color: colorDark });
    page.drawText(r.tm, { x: sumTableX + 195, y: rY, size: 6.5, font: fontRegular, color: colorDark });
    page.drawText(r.tf, { x: sumTableX + 275, y: rY, size: 6.5, font: fontRegular, color: colorDark });
    page.drawText(r.jp, { x: sumTableX + 355, y: rY, size: 6.5, font: fontRegular, color: colorDark });
    page.drawText(r.total, { x: sumTableX + 435, y: rY, size: 6.5, font: fontBold, color: colorDark });
  });

  page.drawLine({ start: { x: sumTableX, y: cellY - 46 }, end: { x: sumTableX + sumTableWidth, y: cellY - 46 }, thickness: 0.75, color: colorDark });

  // Total Row
  const totY = cellY - 56;
  page.drawText('TOTAL ACTIVE EMPLOYEES', { x: sumTableX + 10, y: totY, size: 6.5, font: fontBold, color: colorGreenHeader });
  page.drawText('99', { x: sumTableX + 195, y: totY, size: 6.5, font: fontBold, color: colorDark });
  page.drawText('75', { x: sumTableX + 275, y: totY, size: 6.5, font: fontBold, color: colorDark });
  page.drawText('9', { x: sumTableX + 355, y: totY, size: 6.5, font: fontBold, color: colorDark });
  page.drawText('183', { x: sumTableX + 435, y: totY, size: 7.5, font: fontBold, color: colorGreenHeader });

  // ---------------------------------------------------------------------------
  // 5. SECURITY & AUDIT WATERMARK FOOTER
  // ---------------------------------------------------------------------------
  page.drawText(`OrgFlow Studio Security Governance - Document Hash: ${docId} - Generated: ${generatedDate} - Kintone Read-Only Verified (kintoneWriteEnabled=false)`, {
    x: 35,
    y: 10,
    size: 5.5,
    font: fontRegular,
    color: colorGray
  });

  return await pdfDoc.save();
}
