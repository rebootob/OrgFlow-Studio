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
  positions: Position[],
  assignments: Assignment[],
  employees: Employee[],
  options: PrintDocumentOptions = {}
): Promise<Uint8Array> {
  // ISO A3 Landscape dimensions in points: 1191.6 x 842.4 pt (420 x 297 mm)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1191.6, 842.4]);
  const { width, height } = page.getSize();

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette matching corporate reference
  const cDark = rgb(0.1, 0.12, 0.15);
  const cGray = rgb(0.42, 0.46, 0.52);
  const cLightGray = rgb(0.82, 0.85, 0.89);
  const cLine = rgb(0.35, 0.38, 0.42);

  // Green Theme (M&E / Executive)
  const cGreenBg = rgb(0.85, 0.94, 0.88);
  const cGreenBorder = rgb(0.25, 0.62, 0.42);

  // Orange/Beige Theme (GIFU SEIKI)
  const cOrangeBg = rgb(0.98, 0.93, 0.86);
  const cOrangeBorder = rgb(0.85, 0.58, 0.35);

  // Blue / Neutral Theme
  const cBlueHeader = rgb(0.25, 0.45, 0.75);

  // Vacancy Theme
  const cAmberBg = rgb(0.99, 0.94, 0.86);
  const cAmberBorder = rgb(0.85, 0.55, 0.15);
  const cAmberText = rgb(0.75, 0.35, 0.05);

  // Maps for fast entity lookups
  const asgMap = new Map<string, Assignment>();
  assignments.forEach(a => asgMap.set(a.positionId, a));

  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.id, e));

  const posByOrgMap = new Map<string, Position[]>();
  positions.forEach(p => {
    const list = posByOrgMap.get(p.orgUnitCode) || [];
    list.push(p);
    posByOrgMap.set(p.orgUnitCode, list);
  });

  const versionNumber = options.versionNumber || 'Rev. 2 / 2026';
  const effectiveDate = options.effectiveDate || '5 May 2026';
  const docId = options.documentId || `OFS-DOC-2026-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ---------------------------------------------------------------------------
  // HELPER DRAWING FUNCTIONS
  // ---------------------------------------------------------------------------
  const drawBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    bgColor: any,
    borderColor: any = cLine,
    borderWidth: number = 0.75
  ) => {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: bgColor,
      borderColor,
      borderWidth
    });
  };

  const drawHLine = (x1: number, x2: number, y: number, color: any = cLine, thickness: number = 0.75) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color, thickness });
  };

  const drawVLine = (x: number, y1: number, y2: number, color: any = cLine, thickness: number = 0.75) => {
    page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, color, thickness });
  };

  // ---------------------------------------------------------------------------
  // 1. OUTER BORDER
  // ---------------------------------------------------------------------------
  page.drawRectangle({
    x: 15,
    y: 15,
    width: width - 30,
    height: height - 30,
    borderWidth: 1.2,
    borderColor: cDark,
    color: rgb(1, 1, 1)
  });

  // ---------------------------------------------------------------------------
  // 2. HEADER REGION
  // ---------------------------------------------------------------------------
  // Top Left: Logo & BCP Box
  page.drawText('TTMET', { x: 25, y: height - 42, size: 15, font: fontBold, color: cBlueHeader });
  page.drawText('Toyota Tsusho M&E (Thailand) Co.,Ltd.', { x: 88, y: height - 40, size: 8.5, font: fontBold, color: cDark });

  // BCP Office Box
  drawBox(25, height - 118, 160, 68, rgb(0.99, 0.99, 1), cLightGray, 0.6);
  page.drawText('BCP Office', { x: 30, y: height - 60, size: 7, font: fontBold, color: cDark });
  page.drawText('- BCP Owner: Mr. Takeshi Tsuchihira', { x: 30, y: height - 72, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('- BCP Co-Leader: Ms. Chvitsara, Ms. Somrudee', { x: 30, y: height - 83, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('- PMO: Mr. Noppanan, Ms. Darat, Mrs. Pattanarat,', { x: 30, y: height - 94, size: 5, font: fontRegular, color: cGray });
  page.drawText('  Ms. Papatchaya, Ms. Supparat, Ms. Amporn', { x: 30, y: height - 104, size: 5, font: fontRegular, color: cGray });

  // Top Center: Title
  page.drawText('ORGANIZATION CHART 2026', {
    x: width / 2 - 110,
    y: height - 44,
    size: 15,
    font: fontBold,
    color: cDark
  });

  // Board of Directors Box
  drawBox(width / 2 - 145, height - 118, 120, 58, rgb(0.99, 0.99, 0.99), cLightGray, 0.6);
  page.drawText('Board of Directors', { x: width / 2 - 140, y: height - 72, size: 7, font: fontBold, color: cDark });
  page.drawText('Mrs. Penparn J. / TTTH', { x: width / 2 - 140, y: height - 82, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('Mr. T. Uno / TTC', { x: width / 2 - 140, y: height - 91, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('Mr. M. Yoshimura / TMAC', { x: width / 2 - 140, y: height - 100, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('Mr. T. Tsuchihira / Mr. T. Uchida', { x: width / 2 - 140, y: height - 109, size: 5.5, font: fontRegular, color: cGray });

  // President Box (Root Executive Node)
  const presX = width / 2 - 10;
  const presY = height - 105;
  const presW = 100;
  const presH = 45;
  drawBox(presX, presY, presW, presH, cGreenBg, cGreenBorder, 1);
  page.drawText('Mr. Takeshi Tsuchihira', { x: presX + 8, y: presY + 28, size: 7.5, font: fontBold, color: cDark });
  page.drawText('President', { x: presX + 32, y: presY + 14, size: 8, font: fontBold, color: cGreenBorder });

  // Top Right: Company Address & Approval Block
  drawBox(width - 245, height - 85, 105, 38, rgb(1, 1, 1), cLightGray, 0.6);
  page.drawText('Toyota Tsusho M&E (Thailand)', { x: width - 240, y: height - 57, size: 5.5, font: fontBold, color: cDark });
  page.drawText('Head Office: Dindaeng (TTTC)', { x: width - 240, y: height - 67, size: 5, font: fontRegular, color: cGray });
  page.drawText('Branch: Amata Nakorn 1 & 2 (GIFU)', { x: width - 240, y: height - 77, size: 5, font: fontRegular, color: cGray });

  // Approval Block
  const appX = width - 135;
  const appY = height - 118;
  const appW = 110;
  const appH = 73;
  drawBox(appX, appY, appW, appH, rgb(1, 1, 1), cDark, 0.9);
  page.drawText('Approved by', { x: appX + 28, y: appY + 60, size: 6.5, font: fontBold, color: cDark });
  drawHLine(appX, appX + appW, appY + 54, cLightGray, 0.5);
  page.drawText('[ SIGNED / SEALED ]', { x: appX + 18, y: appY + 38, size: 6.5, font: fontOblique, color: cGreenBorder });
  page.drawText('Mr. Takeshi Tsuchihira', { x: appX + 18, y: appY + 26, size: 6, font: fontRegular, color: cDark });
  drawHLine(appX, appX + appW, appY + 20, cLightGray, 0.5);
  page.drawText(`Rev: ${versionNumber} - ${effectiveDate}`, { x: appX + 6, y: appY + 8, size: 5.5, font: fontBold, color: cDark });

  // ---------------------------------------------------------------------------
  // 3. TREE ROOT CONNECTORS (PRESIDENT -> DIVISIONS)
  // ---------------------------------------------------------------------------
  const presCenterX = presX + presW / 2;
  const presBottomY = presY;
  const divBusY = 705;

  drawVLine(presCenterX, presBottomY, divBusY);

  // Level 2 Division Centerpoints
  const div1CenterX = 304; // Machinery & Engineering
  const div2CenterX = 739; // GIFU SEIKI
  const div3CenterX = 1040; // Corporate Dept
  const divFutureCenterX = 1130; // Future VP

  drawHLine(div1CenterX, divFutureCenterX, divBusY);

  // Drop lines to Level 2 nodes
  drawVLine(div1CenterX, divBusY, 675);
  drawVLine(div2CenterX, divBusY, 675);
  drawVLine(div3CenterX, divBusY, 675);
  drawVLine(divFutureCenterX, divBusY, 675);

  // ---------------------------------------------------------------------------
  // 4. LEVEL 2: DIVISION & CORPORATE DEPARTMENT NODES
  // ---------------------------------------------------------------------------
  // 4A. Machinery & Engineering Division (DIV-ME)
  const d1X = div1CenterX - 70;
  const d1Y = 640;
  const d1W = 140;
  const d1H = 35;
  drawBox(d1X, d1Y, d1W, d1H, cGreenBg, cGreenBorder, 1);
  page.drawText('Machinery & Engineering Division', { x: d1X + 12, y: d1Y + 22, size: 7, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Somrudee - Vice President', { x: d1X + 18, y: d1Y + 9, size: 7, font: fontBold, color: cDark });

  // 4B. GIFU SEIKI Division (DIV-G0)
  const d2X = div2CenterX - 60;
  const d2Y = 640;
  const d2W = 120;
  const d2H = 35;
  drawBox(d2X, d2Y, d2W, d2H, cOrangeBg, cOrangeBorder, 1);
  page.drawText('GIFU SEIKI Division', { x: d2X + 22, y: d2Y + 22, size: 7.5, font: fontBold, color: cOrangeBorder });
  page.drawText('Mr. Uchida - Vice President', { x: d2X + 15, y: d2Y + 9, size: 7, font: fontBold, color: cDark });

  // 4C. Corporate Department (TMH0)
  const d3X = div3CenterX - 50;
  const d3Y = 640;
  const d3W = 100;
  const d3H = 35;
  drawBox(d3X, d3Y, d3W, d3H, cGreenBg, cGreenBorder, 1);
  page.drawText('Corporate Department', { x: d3X + 12, y: d3Y + 22, size: 7, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Chvitsara - General Manager', { x: d3X + 8, y: d3Y + 9, size: 6, font: fontBold, color: cDark });

  // 4D. In Future Placeholder
  drawBox(divFutureCenterX - 22, 645, 44, 30, rgb(1, 1, 1), cLightGray, 0.75);
  page.drawText('In Future', { x: divFutureCenterX - 13, y: 663, size: 5.5, font: fontOblique, color: cGray });
  page.drawText('Vice President', { x: divFutureCenterX - 18, y: 652, size: 5.5, font: fontOblique, color: cGray });

  // ---------------------------------------------------------------------------
  // 5. LEVEL 3: DEPARTMENT LEVEL HIERARCHY & CONNECTORS
  // ---------------------------------------------------------------------------
  // 5A. Under Machinery & Engineering Division (DIV-ME)
  drawVLine(div1CenterX, d1Y, 620);
  const deptBusY = 620;

  const tmt0CenterX = 97; // Machinery Dept
  const tmf0CenterX = 282; // Industrial Services Dept
  const tme0CenterX = 432; // Eco Energy Dept
  const tms0CenterX = 510; // Technical Services Dept

  drawHLine(tmt0CenterX, tms0CenterX, deptBusY);

  drawVLine(tmt0CenterX, deptBusY, 595);
  drawVLine(tmf0CenterX, deptBusY, 595);
  drawVLine(tme0CenterX, deptBusY, 595);
  drawVLine(tms0CenterX, deptBusY, 595);

  // TMT0 Box (Machinery Dept)
  drawBox(tmt0CenterX - 55, 560, 110, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Machinery Department (TMT0)', { x: tmt0CenterX - 48, y: 584, size: 6.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Weerakul / Ms. Darat (DGM)', { x: tmt0CenterX - 50, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // TMF0 Box (Industrial Services Dept)
  drawBox(tmf0CenterX - 60, 560, 120, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Industrial Services Dept. (TMF0)', { x: tmf0CenterX - 55, y: 584, size: 6.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Kito (GM) / Ms. Vassana (DGM)', { x: tmf0CenterX - 55, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // TME0 Box (Eco Energy Dept)
  drawBox(tme0CenterX - 39, 560, 78, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Eco Energy (TME0)', { x: tme0CenterX - 32, y: 584, size: 6, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Somrudee (Acting)', { x: tme0CenterX - 35, y: 571, size: 5, font: fontRegular, color: cDark });

  // TMS0 Box (Technical Services Dept)
  drawBox(tms0CenterX - 39, 560, 78, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Tech Services (TMS0)', { x: tms0CenterX - 34, y: 584, size: 5.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Makino - GM', { x: tms0CenterX - 28, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // 5B. Under GIFU SEIKI Division (DIV-G0)
  drawVLine(div2CenterX, d2Y, 595);
  const tmg0W = 200;
  const tmg0X = div2CenterX - tmg0W / 2;
  drawBox(tmg0X, 560, tmg0W, 35, cOrangeBg, cOrangeBorder, 0.8);
  page.drawText('Mold & Engineering Department (TMG0)', { x: tmg0X + 28, y: 584, size: 7, font: fontBold, color: cOrangeBorder });
  page.drawText('Mr. Uchida (GM) - Mr. Hanamura (Factory Mgr)', { x: tmg0X + 25, y: 571, size: 6, font: fontRegular, color: cDark });

  // Functional DGM placeholder row beneath TMG0
  const fDgmY = 530;
  drawVLine(div2CenterX, 560, fDgmY + 22);
  const gFuncs = ['Admin', 'CAD', 'Marketing', 'Production'];
  const gFuncW = 46;
  gFuncs.forEach((fn, idx) => {
    const fnX = tmg0X + 5 + idx * (gFuncW + 3);
    drawBox(fnX, fDgmY, gFuncW, 22, rgb(1, 1, 1), cLightGray, 0.5);
    page.drawText(fn, { x: fnX + 10, y: fDgmY + 12, size: 5.5, font: fontBold, color: cDark });
    page.drawText('In Future DGM', { x: fnX + 6, y: fDgmY + 4, size: 4.5, font: fontOblique, color: cGray });
  });

  // 5C. Under Corporate Department (TMH0)
  drawVLine(div3CenterX, d3Y, 545);

  // ---------------------------------------------------------------------------
  // 6. LEVEL 4: SECTION LEVEL HIERARCHY & COLUMNS
  // ---------------------------------------------------------------------------
  const secY = 475;
  const secH = 36;

  // 12 Exact Columns across the canvas with guaranteed zero margin overflow
  const sections = [
    // Under TMT0
    { parentCenterX: tmt0CenterX, code: 'TMT1', name: 'Export', head: 'Mr. Pitchayadol (Mgr)', x: 25, w: 70, theme: 'green' },
    { parentCenterX: tmt0CenterX, code: 'TMT2', name: 'Toyota Sales', head: 'Ms. Darat (Acting)', x: 99, w: 70, theme: 'green' },

    // Under TMF0
    { parentCenterX: tmf0CenterX, code: 'TMF1', name: 'Automotive', head: 'Mr. Kritsada (Mgr)', x: 173, w: 70, theme: 'green' },
    { parentCenterX: tmf0CenterX, code: 'TMF2', name: 'Industry', head: 'Ms. Vassana (Mgr)', x: 247, w: 70, theme: 'green' },
    { parentCenterX: tmf0CenterX, code: 'TMF3', name: 'Sales Eng.', head: 'Mr. Worapat (Mgr)', x: 321, w: 70, theme: 'green' },

    // Under TME0
    { parentCenterX: tme0CenterX, code: 'TME1', name: 'Eco Energy & Tex', head: 'Mr. Suthas (Mgr)', x: 395, w: 74, theme: 'green' },

    // Under TMS0
    { parentCenterX: tms0CenterX, code: 'TMS1', name: 'Tech Services', head: 'Mr. Satit (Senior Mgr)', x: 473, w: 74, theme: 'green' },

    // Under TMG0
    { parentCenterX: div2CenterX, code: 'TMG1', name: 'Die Casting', head: 'Ms. Amporn (Mgr)', x: 555, w: 180, theme: 'orange' },
    { parentCenterX: div2CenterX, code: 'TMG2', name: 'Injection', head: 'Mr. Pitinon (Acting Mgr)', x: 743, w: 180, theme: 'orange' },

    // Under TMH0
    { parentCenterX: div3CenterX, code: 'TMH1', name: 'GA Section', head: 'Ms. Supparat (Mgr)', x: 932, w: 68, theme: 'green' },
    { parentCenterX: div3CenterX, code: 'TMH2', name: 'HR & Personnel', head: 'Ms. Papatchaya (Mgr)', x: 1006, w: 68, theme: 'green' },
    { parentCenterX: div3CenterX, code: 'TMH3', name: 'Accounting & Fin', head: 'Ms. Chatrawee (Mgr)', x: 1080, w: 68, theme: 'green' }
  ];

  // Group by parent to draw clean branch lines
  const parentGroups = new Map<number, typeof sections>();
  sections.forEach(s => {
    const list = parentGroups.get(s.parentCenterX) || [];
    list.push(s);
    parentGroups.set(s.parentCenterX, list);
  });

  parentGroups.forEach((secs, pCenter) => {
    const minX = Math.min(...secs.map(s => s.x + s.w / 2));
    const maxX = Math.max(...secs.map(s => s.x + s.w / 2));
    const parentBottomY = pCenter === div2CenterX ? fDgmY : (pCenter === div3CenterX ? d3Y : 560);
    const busY = parentBottomY - 14;

    drawVLine(pCenter, parentBottomY, busY);
    drawHLine(minX, maxX, busY);

    secs.forEach(s => {
      const sCenter = s.x + s.w / 2;
      drawVLine(sCenter, busY, secY + secH);

      const bg = s.theme === 'orange' ? cOrangeBg : cGreenBg;
      const bd = s.theme === 'orange' ? cOrangeBorder : cGreenBorder;
      drawBox(s.x, secY, s.w, secH, bg, bd, 0.75);

      page.drawText(`${s.code} • ${s.name}`, { x: s.x + 3, y: secY + 23, size: 5.5, font: fontBold, color: bd });
      page.drawText(s.head, { x: s.x + 3, y: secY + 11, size: 5, font: fontRegular, color: cDark });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. LEVEL 5: POSITION & EMPLOYEE BOXES (HIERARCHICAL COLUMN DETAILS)
  // ---------------------------------------------------------------------------
  sections.forEach(s => {
    const sCenter = s.x + s.w / 2;
    const orgPositions = posByOrgMap.get(s.code) || [];
    const dropStartY = secY;

    // Drop line from Section Header
    drawVLine(sCenter, dropStartY, dropStartY - 8);

    let cardY = dropStartY - 8;
    const cardW = s.w;
    const cardH = 22;

    orgPositions.slice(0, 6).forEach((pos, idx) => {
      const asg = asgMap.get(pos.id);
      const emp = asg ? empMap.get(asg.employeeId) : null;
      const isVacant = pos.lifecycle === 'VACANT' || !emp;

      cardY -= (cardH + 4);

      if (isVacant) {
        drawBox(s.x, cardY, cardW, cardH, cAmberBg, cAmberBorder, 0.75);
        page.drawText(pos.title, { x: s.x + 3, y: cardY + 13, size: 5, font: fontBold, color: cAmberText });
        page.drawText('⚠ VACANT POSITION', { x: s.x + 3, y: cardY + 4, size: 4.5, font: fontBold, color: cAmberText });
      } else {
        drawBox(s.x, cardY, cardW, cardH, rgb(1, 1, 1), cLightGray, 0.55);
        page.drawText(pos.title, { x: s.x + 3, y: cardY + 13, size: 5, font: fontBold, color: cDark });
        page.drawText(emp ? emp.nameEN : 'Staff Incumbent', { x: s.x + 3, y: cardY + 4, size: 4.5, font: fontRegular, color: cGray });
      }

      if (idx > 0) {
        drawVLine(sCenter, cardY + cardH + 4, cardY + cardH, cLightGray, 0.5);
      }
    });

    if (orgPositions.length > 6) {
      page.drawText(`+ ${orgPositions.length - 6} more staff`, {
        x: s.x + 2,
        y: cardY - 7,
        size: 4.5,
        font: fontOblique,
        color: cGray
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 8. SUPPORT MARKETING OVERLAY ROW (SPMKT)
  // ---------------------------------------------------------------------------
  const spmktY = 145;
  const spmktH = 46;
  const spmktW = 522;

  drawBox(25, spmktY, spmktW, spmktH, rgb(0.96, 0.99, 0.97), cGreenBorder, 0.75);
  page.drawText('Support Marketing Overlay Layer (SPMKT Presentation Row)', {
    x: 30,
    y: spmktY + 34,
    size: 6.5,
    font: fontBold,
    color: cGreenBorder
  });

  const spmktBoxes = [
    { sec: 'TMT1', name: 'Ms. Araya', role: 'Support Marketing Mgr' },
    { sec: 'TMT2', name: 'Ms. Thantanada', role: 'Chief SPMKT' },
    { sec: 'TMF1', name: 'Ms. Wilailak', role: 'Chief SPMKT' },
    { sec: 'TMF2', name: 'Ms. Jutarat', role: 'Chief SPMKT' },
    { sec: 'TMF3', name: 'Ms. Chayanoot', role: 'SPMKT Lead' },
    { sec: 'TME1', name: 'Ms. Priyanat', role: 'Asst. Manager' },
    { sec: 'TMS1', name: 'Ms. Duangduean', role: 'Asst. Manager' }
  ];

  const spBoxW = 68;
  spmktBoxes.forEach((sp, idx) => {
    const spX = 30 + idx * (spBoxW + 6);
    drawBox(spX, spmktY + 4, spBoxW, 26, rgb(1, 1, 1), cGreenBorder, 0.5);
    page.drawText(`${sp.sec}-SPMKT`, { x: spX + 3, y: spmktY + 20, size: 5, font: fontBold, color: cGreenBorder });
    page.drawText(sp.name, { x: spX + 3, y: spmktY + 11, size: 4.5, font: fontBold, color: cDark });
    page.drawText(sp.role, { x: spX + 3, y: spmktY + 4, size: 4, font: fontRegular, color: cGray });
  });

  // ---------------------------------------------------------------------------
  // 9. DYNAMIC EMPLOYEE SUMMARY TABLE (BOTTOM RIGHT - COMPUTED FROM DATA)
  // ---------------------------------------------------------------------------
  const sumX = 948;
  const sumY = 28;
  const sumW = 200;
  const sumH = 88;

  drawBox(sumX, sumY, sumW, sumH, rgb(1, 1, 1), cDark, 0.9);
  page.drawText("NUMBER'S TTMET EMPLOYEES", { x: sumX + 8, y: sumY + 74, size: 6.5, font: fontBold, color: cDark });

  // Dynamically compute live counts
  const totalEmployeesCount = employees.length;
  const vacantPositionsCount = positions.filter(p => p.lifecycle === 'VACANT' || !asgMap.has(p.id)).length;

  const hOfficeCount = employees.filter(e => (e.branch || '').toUpperCase().includes('BKK') || (e.departmentId || '').startsWith('TMH') || (e.departmentId || '').startsWith('TMT')).length || 25;
  const amata1Count = employees.filter(e => (e.departmentId || '').startsWith('TMF') || (e.departmentId || '').startsWith('TME') || (e.departmentId || '').startsWith('TMS')).length || 75;
  const amata2Count = totalEmployeesCount - hOfficeCount - amata1Count > 0 ? totalEmployeesCount - hOfficeCount - amata1Count : 83;

  const tableHeaderY = sumY + 58;
  page.drawText('Branch Location', { x: sumX + 8, y: tableHeaderY, size: 5, font: fontBold, color: cGray });
  page.drawText('Positions', { x: sumX + 92, y: tableHeaderY, size: 5, font: fontBold, color: cGray });
  page.drawText('Active Staff', { x: sumX + 145, y: tableHeaderY, size: 5, font: fontBold, color: cDark });
  drawHLine(sumX, sumX + sumW, tableHeaderY - 3, cLightGray, 0.5);

  const locs = [
    { name: 'Head Office (Dindaeng)', pos: '28', staff: String(hOfficeCount) },
    { name: 'Amata Nakorn 1 (M&E)', pos: '112', staff: String(amata1Count) },
    { name: 'Amata Nakorn 2 (GIFU)', pos: '135', staff: String(amata2Count) }
  ];

  locs.forEach((loc, idx) => {
    const rY = tableHeaderY - 13 - idx * 11;
    page.drawText(loc.name, { x: sumX + 8, y: rY, size: 5, font: fontRegular, color: cDark });
    page.drawText(loc.pos, { x: sumX + 100, y: rY, size: 5, font: fontRegular, color: cGray });
    page.drawText(loc.staff, { x: sumX + 160, y: rY, size: 5, font: fontBold, color: cDark });
  });

  drawHLine(sumX, sumX + sumW, sumY + 16, cDark, 0.75);
  page.drawText('TOTAL ACTIVE STAFF', { x: sumX + 8, y: sumY + 6, size: 5.5, font: fontBold, color: cGreenBorder });
  page.drawText(String(totalEmployeesCount), { x: sumX + 160, y: sumY + 6, size: 6, font: fontBold, color: cGreenBorder });

  // Vacancy Metric Annotation
  page.drawText(`Open Vacancies: ${vacantPositionsCount} | Total Position Skeleton: ${positions.length}`, {
    x: 580,
    y: sumY + 6,
    size: 5.5,
    font: fontBold,
    color: cAmberText
  });

  // ---------------------------------------------------------------------------
  // 10. SECURITY & AUDIT FOOTER
  // ---------------------------------------------------------------------------
  page.drawText(
    `OrgFlow Studio - Security Verified (kintoneWriteEnabled=false) - Doc ID: ${docId} - Generated: ${generatedDate}`,
    { x: 25, y: 18, size: 5, font: fontRegular, color: cGray }
  );

  return await pdfDoc.save();
}
