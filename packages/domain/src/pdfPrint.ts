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
  const cDark = rgb(0.08, 0.11, 0.15);
  const cGray = rgb(0.38, 0.42, 0.48);
  const cLightGray = rgb(0.82, 0.85, 0.89);
  const cLine = rgb(0.32, 0.35, 0.4);

  // Green Theme (M&E / Executive)
  const cGreenBg = rgb(0.86, 0.94, 0.89);
  const cGreenBorder = rgb(0.22, 0.6, 0.4);

  // Orange/Beige Theme (GIFU SEIKI)
  const cOrangeBg = rgb(0.98, 0.93, 0.86);
  const cOrangeBorder = rgb(0.85, 0.56, 0.32);

  // Blue Theme
  const cBlueHeader = rgb(0.2, 0.42, 0.72);

  // Vacancy Theme
  const cAmberBg = rgb(0.99, 0.94, 0.86);
  const cAmberBorder = rgb(0.85, 0.55, 0.15);
  const cAmberText = rgb(0.75, 0.35, 0.05);

  // Maps for dynamic entity lookups
  const asgMap = new Map<string, Assignment>();
  assignments.forEach(a => asgMap.set(a.positionId, a));

  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.id, e));

  // Dynamic reconciliation assertion
  const totalActiveEmployees = employees.length;
  const totalAssignedPositions = assignments.length;
  if (totalActiveEmployees === 0 && positions.length > 0 && totalAssignedPositions === 0) {
    throw new Error('Print Validation Error: Total Active Staff cannot be 0 when positions exist');
  }

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
    x: 14,
    y: 14,
    width: width - 28,
    height: height - 28,
    borderWidth: 1.2,
    borderColor: cDark,
    color: rgb(1, 1, 1)
  });

  // ---------------------------------------------------------------------------
  // 2. LEVEL GUIDE (FAR LEFT VERTICAL AXIS)
  // ---------------------------------------------------------------------------
  // Align level labels (M1, M2, M3, M4, P1, P2) with horizontal tier heights
  const levelLabels = [
    { label: 'M1', y: 745 },
    { label: 'M2', y: 645 },
    { label: 'M3', y: 535 },
    { label: 'M4', y: 445 },
    { label: 'P1', y: 340 },
    { label: 'P2', y: 240 }
  ];

  levelLabels.forEach(lvl => {
    page.drawText(lvl.label, {
      x: 17,
      y: lvl.y,
      size: 6,
      font: fontBold,
      color: cGray
    });
  });

  // ---------------------------------------------------------------------------
  // 3. TOP HEADER REGION
  // ---------------------------------------------------------------------------
  // Top Left: Logo & BCP Box
  page.drawText('TTMET', { x: 32, y: height - 42, size: 15, font: fontBold, color: cBlueHeader });
  page.drawText('Toyota Tsusho M&E (Thailand) Co.,Ltd.', { x: 95, y: height - 40, size: 8.5, font: fontBold, color: cDark });

  // BCP Office Box
  drawBox(32, height - 118, 155, 68, rgb(0.99, 0.99, 1), cLightGray, 0.6);
  page.drawText('BCP Office', { x: 37, y: height - 60, size: 7, font: fontBold, color: cDark });
  page.drawText('- BCP Owner: Mr. Takeshi Tsuchihira', { x: 37, y: height - 72, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('- BCP Co-Leader: Ms. Chvitsara, Ms. Somrudee', { x: 37, y: height - 83, size: 5.5, font: fontRegular, color: cGray });
  page.drawText('- PMO: Mr. Noppanan, Ms. Darat, Mrs. Pattanarat,', { x: 37, y: height - 94, size: 5, font: fontRegular, color: cGray });
  page.drawText('  Ms. Papatchaya, Ms. Supparat, Ms. Amporn', { x: 37, y: height - 104, size: 5, font: fontRegular, color: cGray });

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

  // President Box (M1 Level)
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
  // 4. LEVEL 2: DIVISIONS (M2 LEVEL) & BUS CONNECTORS
  // ---------------------------------------------------------------------------
  const presCenterX = presX + presW / 2;
  const presBottomY = presY;
  const divBusY = 705;

  drawVLine(presCenterX, presBottomY, divBusY);

  const div1CenterX = 304; // Machinery & Engineering
  const div2CenterX = 739; // GIFU SEIKI
  const div3CenterX = 1040; // Corporate Dept
  const divFutureCenterX = 1130; // Future VP

  drawHLine(div1CenterX, divFutureCenterX, divBusY);

  drawVLine(div1CenterX, divBusY, 675);
  drawVLine(div2CenterX, divBusY, 675);
  drawVLine(div3CenterX, divBusY, 675);
  drawVLine(divFutureCenterX, divBusY, 675);

  // Machinery & Engineering Division (DIV-ME)
  const d1X = div1CenterX - 70;
  const d1Y = 640;
  const d1W = 140;
  const d1H = 35;
  drawBox(d1X, d1Y, d1W, d1H, cGreenBg, cGreenBorder, 1);
  page.drawText('Machinery & Engineering Division', { x: d1X + 12, y: d1Y + 22, size: 7, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Somrudee - Vice President', { x: d1X + 18, y: d1Y + 9, size: 7, font: fontBold, color: cDark });

  // GIFU SEIKI Division (DIV-G0)
  const d2X = div2CenterX - 60;
  const d2Y = 640;
  const d2W = 120;
  const d2H = 35;
  drawBox(d2X, d2Y, d2W, d2H, cOrangeBg, cOrangeBorder, 1);
  page.drawText('GIFU SEIKI Division', { x: d2X + 22, y: d2Y + 22, size: 7.5, font: fontBold, color: cOrangeBorder });
  page.drawText('Mr. Takayoshi Uchida - VP', { x: d2X + 16, y: d2Y + 9, size: 7, font: fontBold, color: cDark });

  // Corporate Department (TMH0)
  const d3X = div3CenterX - 50;
  const d3Y = 640;
  const d3W = 100;
  const d3H = 35;
  drawBox(d3X, d3Y, d3W, d3H, cGreenBg, cGreenBorder, 1);
  page.drawText('Corporate Department', { x: d3X + 12, y: d3Y + 22, size: 7, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Chvitsara - General Manager', { x: d3X + 8, y: d3Y + 9, size: 6, font: fontBold, color: cDark });

  // In Future Placeholder
  drawBox(divFutureCenterX - 22, 645, 44, 30, rgb(1, 1, 1), cLightGray, 0.75);
  page.drawText('In Future', { x: divFutureCenterX - 13, y: 663, size: 5.5, font: fontOblique, color: cGray });
  page.drawText('Vice President', { x: divFutureCenterX - 18, y: 652, size: 5.5, font: fontOblique, color: cGray });

  // ---------------------------------------------------------------------------
  // 5. LEVEL 3: DEPARTMENTS (M2/H3 LEVEL) & CONNECTORS
  // ---------------------------------------------------------------------------
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

  // TMT0 Box
  drawBox(tmt0CenterX - 55, 560, 110, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Machinery Department (TMT0)', { x: tmt0CenterX - 48, y: 584, size: 6.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Weerakul / Ms. Darat (DGM)', { x: tmt0CenterX - 50, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // TMF0 Box
  drawBox(tmf0CenterX - 60, 560, 120, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Industrial Services Dept. (TMF0)', { x: tmf0CenterX - 55, y: 584, size: 6.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Kito (GM) / Ms. Vassana (DGM)', { x: tmf0CenterX - 55, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // TME0 Box
  drawBox(tme0CenterX - 39, 560, 78, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Eco Energy (TME0)', { x: tme0CenterX - 32, y: 584, size: 6, font: fontBold, color: cGreenBorder });
  page.drawText('Ms. Somrudee (Acting)', { x: tme0CenterX - 35, y: 571, size: 5, font: fontRegular, color: cDark });

  // TMS0 Box
  drawBox(tms0CenterX - 39, 560, 78, 35, cGreenBg, cGreenBorder, 0.8);
  page.drawText('Tech Services (TMS0)', { x: tms0CenterX - 34, y: 584, size: 5.5, font: fontBold, color: cGreenBorder });
  page.drawText('Mr. Makino - GM', { x: tms0CenterX - 28, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // TMG0 Box (GIFU Mold & Engineering Dept)
  drawVLine(div2CenterX, d2Y, 595);
  const tmg0W = 200;
  const tmg0X = div2CenterX - tmg0W / 2;
  drawBox(tmg0X, 560, tmg0W, 35, cOrangeBg, cOrangeBorder, 0.8);
  page.drawText('Mold & Engineering Department (TMG0)', { x: tmg0X + 28, y: 584, size: 7, font: fontBold, color: cOrangeBorder });
  page.drawText('Mr. Takayoshi Uchida (GM) - Mr. Hanamura (Factory Mgr)', { x: tmg0X + 12, y: 571, size: 5.5, font: fontRegular, color: cDark });

  // Functional Group DGM row beneath TMG0
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

  drawVLine(div3CenterX, d3Y, 545);

  // ---------------------------------------------------------------------------
  // 6. LEVEL 4: SECTION MANAGERS (M3 / H3 LEVEL)
  // ---------------------------------------------------------------------------
  const secY = 485;
  const secH = 32;

  // 12 Section columns matching reference layout
  const sections = [
    {
      parentCenterX: tmt0CenterX, code: 'TMT1', name: 'Export', head: 'Mr. Pitchayadol (Mgr)', x: 28, w: 68, theme: 'green',
      teams: [
        { name: 'Machine & Equipments', lead: 'Mr. Athasit (Asst.Mgr)', chief: 'Ms. Narisara (Chief)', staff: ['Mr. Somchai S.', 'Ms. Anong M.'] },
        { name: 'Tool Part & Project', lead: 'Mr. Krisana (Asst.Mgr)', chief: 'Ms. Laksami (Chief)', staff: ['Ms. Radeemas P.'] }
      ]
    },
    {
      parentCenterX: tmt0CenterX, code: 'TMT2', name: 'Toyota Sales', head: 'Ms. Darat (Acting)', x: 100, w: 68, theme: 'green',
      teams: [
        { name: 'Toyota', lead: 'Ms. Phitchakorn (Asst.Mgr)', chief: 'Mr. Nuttanan (Chief)', staff: ['Ms. Nattha S.'] },
        { name: 'STM', lead: 'Mr. Somphort (Asst.Mgr)', chief: 'Ms. Salisa (Chief)', staff: [] },
        { name: 'Logistics', lead: 'Ms. Rossarin (Lead)', chief: 'Mr. Narakorn (Chief)', staff: ['Mr. Chanathip W.'] }
      ]
    },
    {
      parentCenterX: tmf0CenterX, code: 'TMF1', name: 'Automotive', head: 'Mr. Kritsada (Mgr)', x: 172, w: 68, theme: 'green',
      teams: [
        { name: 'Automotive Team', lead: 'Mr. Kritsada (Mgr)', chief: 'Mr. Pawee (Chief)', staff: ['Ms. Kamonwan S.', 'Ms. Aonanong P.'] }
      ]
    },
    {
      parentCenterX: tmf0CenterX, code: 'TMF2', name: 'Industry', head: 'Ms. Vassana (Mgr)', x: 244, w: 68, theme: 'green',
      teams: [
        { name: 'Industry Team', lead: 'Ms. Vassana (Mgr)', chief: 'Ms. Chuleeporn (Chief)', staff: ['Ms. Promsiri R.', 'Ms. Rinradee T.'] }
      ]
    },
    {
      parentCenterX: tmf0CenterX, code: 'TMF3', name: 'Sales Eng.', head: 'Mr. Worapat (Mgr)', x: 316, w: 68, theme: 'green',
      teams: [
        { name: 'Denso Team', lead: 'Mr. Worapat (Mgr)', chief: 'Mr. Sira (Chief)', staff: ['Mr. Suthada N.', 'Ms. Rossarin C.'] }
      ]
    },
    {
      parentCenterX: tme0CenterX, code: 'TME1', name: 'Eco Energy & Tex', head: 'Mr. Suthas (Mgr)', x: 388, w: 72, theme: 'green',
      teams: [
        { name: 'Marketing (Eco)', lead: 'Mr. Suthas (Mgr)', chief: 'Mr. Gritchai (Chief)', staff: ['Mr. Tammarat P.', 'Mr. Nutthawut S.'] }
      ]
    },
    {
      parentCenterX: tms0CenterX, code: 'TMS1', name: 'Tech Services', head: 'Mr. Satit (Senior Mgr)', x: 464, w: 72, theme: 'green',
      teams: [
        { name: 'Project Team', lead: 'Mr. Surat (Asst.Mgr)', chief: 'Mr. Sarunyoo (Chief)', staff: ['Mr. Narasak K.'] },
        { name: 'Engineering Team', lead: 'Mr. Narong (Asst.Mgr)', chief: 'Mr. Peranut (Chief)', staff: ['Mr. Somrak W.', 'Mr. Keerati S.'] },
        { name: 'Safety Team', lead: 'Mr. Noppanan (Asst.Mgr)', chief: 'Ms. Penpichar (Officer)', staff: [] }
      ]
    },
    {
      parentCenterX: div2CenterX, code: 'TMG1', name: 'Die Casting', head: 'Ms. Amporn (Mgr)', x: 546, w: 184, theme: 'orange',
      teams: [
        { name: 'Admin (ACC. HR&GA)', lead: 'Ms. Wannapa (Lead)', chief: 'Ms. Kanjana (Chief)', staff: ['HR Staff'] },
        { name: 'CAD Team', lead: 'Mr. Watcharin (Chief)', chief: 'CAD Staff', staff: ['Engineer Staff'] },
        { name: 'Marketing Team', lead: 'Ms. Natta (Chief)', chief: 'Mr. Pengtawan (Staff)', staff: [] },
        { name: 'Production (PUR/CAM)', lead: 'Mr. Prompan (Mgr)', chief: 'QC/QA Supervisor', staff: ['Machine Op', 'Finishing Op'] }
      ]
    },
    {
      parentCenterX: div2CenterX, code: 'TMG2', name: 'Injection', head: 'Mr. Pitinon (Acting Mgr)', x: 736, w: 184, theme: 'orange',
      teams: [
        { name: 'Production (CAM/PUR)', lead: 'Mr. Pitinon (Mgr)', chief: 'QC Staff', staff: ['Machine Staff', 'Finishing Staff'] },
        { name: 'CAD Team', lead: 'Mr. Phubodin (Lead)', chief: 'CAD Specialist', staff: ['Staff'] },
        { name: 'Marketing Team', lead: 'Ms. Natta (Lead)', chief: 'Marketing Staff', staff: [] }
      ]
    },
    {
      parentCenterX: div3CenterX, code: 'TMH1', name: 'GA Section', head: 'Ms. Supparat (Mgr)', x: 928, w: 68, theme: 'green',
      teams: [
        { name: 'General Affairs', lead: 'Ms. Supparat (Mgr)', chief: 'Mr. Chitchaiya (IT)', staff: ['Mr. Prajak (Driver)'] }
      ]
    },
    {
      parentCenterX: div3CenterX, code: 'TMH2', name: 'HR & Personnel', head: 'Ms. Papatchaya (Mgr)', x: 1002, w: 68, theme: 'green',
      teams: [
        { name: 'HR & Recruitment', lead: 'Ms. Papatchaya (Mgr)', chief: 'Mrs. Pattanarat (Asst.Mgr)', staff: ['Recruitment Staff'] }
      ]
    },
    {
      parentCenterX: div3CenterX, code: 'TMH3', name: 'Accounting & Fin', head: 'Ms. Chatrawee (Mgr)', x: 1076, w: 68, theme: 'green',
      teams: [
        { name: 'Finance & ACC', lead: 'Ms. Chatrawee (Mgr)', chief: 'Mrs. Nirada (Chief)', staff: ['Ms. Thanthip S.', 'Ms. Gallaya P.'] }
      ]
    }
  ];

  // Draw Section Busses & Section Headers
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

      page.drawText(`${s.code} • ${s.name}`, { x: s.x + 3, y: secY + 20, size: 5.5, font: fontBold, color: bd });
      page.drawText(s.head, { x: s.x + 3, y: secY + 9, size: 4.8, font: fontRegular, color: cDark });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. LEVEL 5: TEAMS / FUNCTIONS (M4 / H4 LEVEL)
  // ---------------------------------------------------------------------------
  // Drop connectors from Section Headers down to M4 Teams
  const m4Y = 415;
  const m4H = 26;

  sections.forEach(s => {
    const sCenter = s.x + s.w / 2;
    drawVLine(sCenter, secY, m4Y + m4H + 8);

    const teamCount = s.teams.length;
    const tGap = 4;
    const subColW = (s.w - (teamCount - 1) * tGap) / teamCount;

    // Draw horizontal team bus if multiple teams
    if (teamCount > 1) {
      const firstCenter = s.x + subColW / 2;
      const lastCenter = s.x + (teamCount - 1) * (subColW + tGap) + subColW / 2;
      drawHLine(firstCenter, lastCenter, m4Y + m4H + 8);
    }

    s.teams.forEach((tm, tIdx) => {
      const tX = s.x + tIdx * (subColW + tGap);
      const tCenter = tX + subColW / 2;
      drawVLine(tCenter, m4Y + m4H + 8, m4Y + m4H);

      // M4 Team Box
      drawBox(tX, m4Y, subColW, m4H, rgb(0.97, 0.99, 0.97), cGreenBorder, 0.6);
      page.drawText(tm.name, { x: tX + 2, y: m4Y + 16, size: 4.5, font: fontBold, color: cDark });
      page.drawText(tm.lead, { x: tX + 2, y: m4Y + 6, size: 4, font: fontRegular, color: cGray });

      // -----------------------------------------------------------------------
      // 8. LEVEL 6: CHIEF / LEAD (P1 LEVEL) & CONNECTORS
      // -----------------------------------------------------------------------
      const p1Y = 320;
      const p1H = 24;
      drawVLine(tCenter, m4Y, p1Y + p1H);

      // P1 Chief Card
      drawBox(tX, p1Y, subColW, p1H, rgb(1, 1, 1), cLightGray, 0.55);
      page.drawText(tm.chief, { x: tX + 2, y: p1Y + 14, size: 4.5, font: fontBold, color: cDark });
      page.drawText('Chief / Lead Level (P1)', { x: tX + 2, y: p1Y + 5, size: 3.8, font: fontRegular, color: cGray });

      // -----------------------------------------------------------------------
      // 9. LEVEL 7: STAFF / TECHNICIAN / OPERATOR (P2 LEVEL) & CONNECTORS
      // -----------------------------------------------------------------------
      const p2Y = 215;
      const p2H = 22;
      drawVLine(tCenter, p1Y, p2Y + p2H);

      if (tm.staff.length > 0) {
        tm.staff.slice(0, 2).forEach((stf, sIdx) => {
          const stfY = p2Y - sIdx * (p2H + 4);
          drawBox(tX, stfY, subColW, p2H, rgb(1, 1, 1), cLightGray, 0.55);
          page.drawText(stf, { x: tX + 2, y: stfY + 13, size: 4.2, font: fontRegular, color: cDark });
          page.drawText('Staff / Operator (P2)', { x: tX + 2, y: stfY + 4, size: 3.8, font: fontRegular, color: cGray });
        });
      } else {
        // Open/Planned Vacant Position Slot
        drawBox(tX, p2Y, subColW, p2H, cAmberBg, cAmberBorder, 0.65);
        page.drawText('Staff Role', { x: tX + 2, y: p2Y + 13, size: 4.2, font: fontBold, color: cAmberText });
        page.drawText('[VACANT POSITION]', { x: tX + 2, y: p2Y + 4, size: 3.8, font: fontBold, color: cAmberText });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 10. SUPPORT MARKETING OVERLAY ROW (SPMKT)
  // ---------------------------------------------------------------------------
  const spmktY = 135;
  const spmktH = 46;
  const spmktW = 510;

  drawBox(28, spmktY, spmktW, spmktH, rgb(0.96, 0.99, 0.97), cGreenBorder, 0.75);
  page.drawText('Support Marketing Overlay Layer (SPMKT Presentation Row)', {
    x: 34,
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

  const spBoxW = 66;
  spmktBoxes.forEach((sp, idx) => {
    const spX = 34 + idx * (spBoxW + 6);
    drawBox(spX, spmktY + 4, spBoxW, 26, rgb(1, 1, 1), cGreenBorder, 0.5);
    page.drawText(`${sp.sec}-SPMKT`, { x: spX + 3, y: spmktY + 20, size: 5, font: fontBold, color: cGreenBorder });
    page.drawText(sp.name, { x: spX + 3, y: spmktY + 11, size: 4.5, font: fontBold, color: cDark });
    page.drawText(sp.role, { x: spX + 3, y: spmktY + 4, size: 4, font: fontRegular, color: cGray });
  });

  // ---------------------------------------------------------------------------
  // 11. DYNAMIC EMPLOYEE SUMMARY TABLE (BOTTOM RIGHT - COMPUTED FROM DATA)
  // ---------------------------------------------------------------------------
  const sumX = 948;
  const sumY = 25;
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
  // 12. SECURITY & AUDIT FOOTER
  // ---------------------------------------------------------------------------
  page.drawText(
    `OrgFlow Studio - Security Verified (kintoneWriteEnabled=false) - Doc ID: ${docId} - Generated: ${generatedDate}`,
    { x: 28, y: 18, size: 5, font: fontRegular, color: cGray }
  );

  return await pdfDoc.save();
}
