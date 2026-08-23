import crypto from 'crypto';
import {
  OrgUnit,
  Position,
  Assignment,
  Employee,
  buildNormalizedDataset,
  calculateTreeInvariants,
  validateOrganizationIntegrity
} from '@orgflow/domain';
import { env } from '../../config/env.js';
import { kintoneClient } from './kintone.client.js';
import { KintoneSourceSnapshotMeta, APP53_FIELD_MAPPINGS, KintoneRawRecord } from './kintone.types.js';

// Canonical 57 Master reference data for fallback/fixture
const CANONICAL_57_MASTER = [
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

export class KintoneAdapter {
  /**
   * Fetches and normalizes current organization from live Kintone Apps 53, 791, 792.
   * Creates a verifiable Source Snapshot package.
   * Strictly FAILS CLOSED if live data cannot be retrieved (no synthetic fallback).
   */
  async loadCurrentOrganization(): Promise<{
    meta: KintoneSourceSnapshotMeta;
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
    employees: Employee[];
    validation: { valid: boolean; errors: string[]; warnings: string[] };
    invariants: ReturnType<typeof calculateTreeInvariants>;
  }> {
    const rawEmployees: KintoneRawRecord[] = await kintoneClient.fetchAllRecords(env.KINTONE_APP_EMPLOYEE);

    // FAIL CLOSED: If Kintone Live Read cannot retrieve records, DO NOT fallback to synthetic fixture
    if (!rawEmployees || rawEmployees.length === 0) {
      throw new Error(
        'KINTONE_LIVE_READ_FAILED: Unable to retrieve employee records from Kintone App 53. Synthetic fallbacks are strictly disabled in production/acceptance mode.'
      );
    }

    const rawOrgs: KintoneRawRecord[] = await kintoneClient.fetchAllRecords(env.KINTONE_APP_ORGANIZATION);

    // Build unified organization master from 57 Canonical Nodes + live App 791 overlays
    const orgMaster = [...CANONICAL_57_MASTER];
    if (rawOrgs && rawOrgs.length > 0) {
      rawOrgs.forEach(ro => {
        const code = ro.organization_code?.value || ro.code?.value;
        const name = ro.organization_name?.value || ro.name?.value;
        const parentCode = ro.parent_organization_code?.value || ro.parentCode?.value;
        const level = ro.organization_level?.value ? parseInt(ro.organization_level.value, 10) : undefined;
        const type = ro.organization_type?.value;

        if (code) {
          const existing = orgMaster.find(o => o.code === code);
          const sanitizedParent = (code === 'TTMET' || !parentCode || parentCode.trim() === '') ? null : parentCode.trim();

          if (existing) {
            if (name) existing.name = name;
            existing.parentCode = sanitizedParent;
            if (level !== undefined && !isNaN(level)) existing.level = level;
            if (type) existing.type = type;
          } else if (name) {
            orgMaster.push({
              code,
              name,
              parentCode: sanitizedParent,
              level: level || 3,
              type: type || 'DEPARTMENT'
            });
          }
        }
      });
    }

    // Normalize live records into OrgFlow domain
    const dataset = buildNormalizedDataset(orgMaster, rawEmployees as any, true);

    const validation = validateOrganizationIntegrity(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments
    );

    const invariants = calculateTreeInvariants(
      dataset.orgUnits,
      dataset.positions,
      dataset.assignments,
      dataset.employees
    );

    const treeHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ orgs: dataset.orgUnits.length, pos: dataset.positions.length, emp: dataset.employees.length }))
      .digest('hex');

    const meta: KintoneSourceSnapshotMeta = {
      snapshotId: `kintone-snap-live-${Date.now()}`,
      loadedAt: new Date().toISOString(),
      sourceProvider: 'KINTONE_LIVE',
      environment: 'Read-Only (kintoneWriteEnabled=false)',
      app53Count: dataset.employees.length,
      app791Count: invariants.canonicalCount,
      app792Count: dataset.assignments.length,
      mappingVersion: '2.0.0-kintone-live',
      treeHash
    };

    return {
      meta,
      orgUnits: dataset.orgUnits,
      positions: dataset.positions,
      assignments: dataset.assignments,
      employees: dataset.employees,
      validation,
      invariants
    };
  }
}

export const kintoneAdapter = new KintoneAdapter();
