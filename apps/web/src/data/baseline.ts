import { RawLegacyOrgRecord, RawLegacyEmployeeRecord } from '@orgflow/domain';

export const CANONICAL_57_MASTER: RawLegacyOrgRecord[] = [
  { code: "TTMET", name: "Toyota Tsusho M&E (Thailand) Co.,Ltd.", type: "COMPANY", level: 1, parentCode: null },
  { code: "DIV-ME", name: "Machinery & Engineering Division", type: "DIVISION", level: 2, parentCode: "TTMET" },
  { code: "DIV-G0", name: "GIFU SEIKI Division", type: "DIVISION", level: 2, parentCode: "TTMET" },
  { code: "TMT0", name: "Machinery Department", type: "DEPARTMENT", level: 3, parentCode: "DIV-ME" },
  { code: "TMF0", name: "Industrial Services Department", type: "DEPARTMENT", level: 3, parentCode: "DIV-ME" },
  { code: "TME0", name: "Eco Energy & Textile Machinery Department", type: "DEPARTMENT", level: 3, parentCode: "DIV-ME" },
  { code: "TMS0", name: "Technical Services Department", type: "DEPARTMENT", level: 3, parentCode: "DIV-ME" },
  { code: "TMG0", name: "Mold & Engineering Department", type: "DEPARTMENT", level: 3, parentCode: "DIV-G0" },
  { code: "TMH0", name: "Corporate Department", type: "DEPARTMENT", level: 3, parentCode: "TTMET" },
  { code: "TMT1", name: "Export", type: "SECTION", level: 4, parentCode: "TMT0" },
  { code: "TMT2", name: "Toyota Sales", type: "SECTION", level: 4, parentCode: "TMT0" },
  { code: "TMT1-MACH", name: "Machine & Equipments", type: "TEAM", level: 5, parentCode: "TMT1" },
  { code: "TMT1-TRIAL", name: "Tool Part & Project", type: "TEAM", level: 5, parentCode: "TMT1" },
  { code: "TMT2-TOYOTA", name: "TOYOTA", type: "TEAM", level: 5, parentCode: "TMT2" },
  { code: "TMT2-STM", name: "STM", type: "TEAM", level: 5, parentCode: "TMT2" },
  { code: "TMT2-LOGITIC", name: "Logistics", type: "TEAM", level: 5, parentCode: "TMT2" },
  { code: "TMF1", name: "Automotive", type: "SECTION", level: 4, parentCode: "TMF0" },
  { code: "TMF2", name: "Industry", type: "SECTION", level: 4, parentCode: "TMF0" },
  { code: "TMF3", name: "Sales Engineering", type: "SECTION", level: 4, parentCode: "TMF0" },
  { code: "TMF1-AUTOMOTIVE", name: "AUTOMOTIVE", type: "TEAM", level: 5, parentCode: "TMF1" },
  { code: "TMF2-INDUSTRY", name: "INDUSTRY", type: "TEAM", level: 5, parentCode: "TMF2" },
  { code: "TMF3-DENSO", name: "DENSO", type: "TEAM", level: 5, parentCode: "TMF3" },
  { code: "TME1", name: "Eco Energy & Textile Machinery", type: "SECTION", level: 4, parentCode: "TME0" },
  { code: "TME1-MARK", name: "Marketing (Eco Energy)", type: "TEAM", level: 5, parentCode: "TME1" },
  { code: "TMS1", name: "Technical Services", type: "SECTION", level: 4, parentCode: "TMS0" },
  { code: "TMS1-PROJ", name: "Project Management", type: "TEAM", level: 5, parentCode: "TMS1" },
  { code: "TMS1-ENGI", name: "Engineering", type: "TEAM", level: 5, parentCode: "TMS1" },
  { code: "TMS1-SAFE", name: "Safety & ISO", type: "TEAM", level: 5, parentCode: "TMS1" },
  { code: "TMG0-ADM", name: "Admin", type: "FUNCTION", level: 4, parentCode: "TMG0" },
  { code: "TMG0-CAD", name: "CAD", type: "FUNCTION", level: 4, parentCode: "TMG0" },
  { code: "TMG0-MKT", name: "Marketing", type: "FUNCTION", level: 4, parentCode: "TMG0" },
  { code: "TMG0-PRD", name: "Production", type: "FUNCTION", level: 4, parentCode: "TMG0" },
  { code: "TMG1", name: "Die Casting", type: "SECTION", level: 4, parentCode: "TMG0" },
  { code: "TMG2", name: "Injection", type: "SECTION", level: 4, parentCode: "TMG0" },
  { code: "TMG1-ADM", name: "Admin", type: "TEAM", level: 5, parentCode: "TMG1" },
  { code: "TMG1-ADM-HR", name: "ACC. HR & GA", type: "SUB-TEAM", level: 6, parentCode: "TMG1-ADM" },
  { code: "TMG1-CAD", name: "CAD", type: "TEAM", level: 5, parentCode: "TMG1" },
  { code: "TMG1-MKT", name: "Marketing", type: "TEAM", level: 5, parentCode: "TMG1" },
  { code: "TMG1-PRD", name: "Production", type: "TEAM", level: 5, parentCode: "TMG1" },
  { code: "TMG1-PRD-PUR", name: "PC/PUR", type: "SUB-TEAM", level: 6, parentCode: "TMG1-PRD" },
  { code: "TMG1-PRD-PUR-MC", name: "Machine", type: "FUNCTION", level: 7, parentCode: "TMG1-PRD-PUR" },
  { code: "TMG1-PRD-PUR-FN", name: "Finishing", type: "FUNCTION", level: 7, parentCode: "TMG1-PRD-PUR" },
  { code: "TMG1-PRD-PUR-QA", name: "QA", type: "FUNCTION", level: 7, parentCode: "TMG1-PRD-PUR" },
  { code: "TMG1-PRD-CAM", name: "CAM", type: "SUB-TEAM", level: 6, parentCode: "TMG1-PRD" },
  { code: "TMG1-PRD-CAM-QC", name: "QC", type: "FUNCTION", level: 7, parentCode: "TMG1-PRD-CAM" },
  { code: "TMG2-PRD", name: "Production", type: "TEAM", level: 5, parentCode: "TMG2" },
  { code: "TMG2-PRD-CAM", name: "CAM", type: "SUB-TEAM", level: 6, parentCode: "TMG2-PRD" },
  { code: "TMG2-PRD-CAM-QC", name: "QC", type: "FUNCTION", level: 7, parentCode: "TMG2-PRD-CAM" },
  { code: "TMG2-PRD-PUR", name: "PC/PUR", type: "SUB-TEAM", level: 6, parentCode: "TMG2-PRD" },
  { code: "TMG2-PRD-PUR-MC", name: "Machine", type: "FUNCTION", level: 7, parentCode: "TMG2-PRD-PUR" },
  { code: "TMG2-PRD-PUR-FN", name: "Finishing", type: "FUNCTION", level: 7, parentCode: "TMG2-PRD-PUR" },
  { code: "TMG2-PRD-PUR-QA", name: "QA", type: "FUNCTION", level: 7, parentCode: "TMG2-PRD-PUR" },
  { code: "TMG2-CAD", name: "CAD", type: "TEAM", level: 5, parentCode: "TMG2" },
  { code: "TMG2-MKT", name: "Marketing", type: "TEAM", level: 5, parentCode: "TMG2" },
  { code: "TMH1", name: "GA", type: "SECTION", level: 4, parentCode: "TMH0" },
  { code: "TMH2", name: "HR & Personnel", type: "SECTION", level: 4, parentCode: "TMH0" },
  { code: "TMH3", name: "Accounting & Finance", type: "SECTION", level: 4, parentCode: "TMH0" }
];

export function generate275EmployeesFixture(): RawLegacyEmployeeRecord[] {
  const titles = [
    'President', 'Vice President', 'General Manager', 'Assistant General Manager',
    'Department Manager', 'Section Manager', 'Assistant Section Manager',
    'Senior Engineer', 'Engineer', 'Officer', 'Senior Officer', 'Technician', 'Specialist'
  ];

  const orgUnits = CANONICAL_57_MASTER;
  const employees: RawLegacyEmployeeRecord[] = [];

  for (let i = 1; i <= 275; i++) {
    const orgIndex = i % orgUnits.length;
    const org = orgUnits[orgIndex];
    const empCode = `EMP-${String(i).padStart(3, '0')}`;
    const title = titles[i % titles.length];

    employees.push({
      $id: { value: String(i) },
      emp_text: { value: empCode },
      Text_0: { value: `พนักงานทดสอบ ${i}` },
      Text: { value: `Employee Staff ${i}` },
      Text_1: { value: `Staff${i}` },
      Drop_down_0: { value: org.code },
      Drop_down_1: { value: org.parentCode || '' },
      Drop_down_2: { value: org.name },
      Text_2: { value: title },
      Status: { value: 'Active' },
      Radio_button: { value: i % 2 === 0 ? 'BKK' : 'AMT' }
    });
  }

  return employees;
}
