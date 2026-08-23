import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  OrgUnit,
  Position,
  Assignment,
  Employee,
  OrganizationSnapshot,
  ChangeOperation,
  DiffReport,
  validateOrganizationIntegrity,
  canReparentOrgUnit,
  canCloseOrgUnit,
  computeVersionDiff,
  detectCircularReporting,
  buildNormalizedDataset
} from '@orgflow/domain';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../data/baseline.js';

export interface OrgStoreState {
  viewMode: 'CURRENT_OFFICIAL' | 'DRAFT';
  draftName: string;
  planName: string;
  currentVersionName: string;
  effectiveDate: string;
  sourceSnapshotMeta: {
    snapshotId: string;
    loadedAt: string;
    mappingVersion: string;
    treeHash: string;
  } | null;

  currentRootOrgCode: string | null;

  // Working State (Active view on Canvas)
  orgUnits: OrgUnit[];
  positions: Position[];
  assignments: Assignment[];
  employees: Employee[];

  // Official Baseline Cache (for switching back and forth)
  officialBaseline: {
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
    employees: Employee[];
  } | null;

  // Change Log & Operations
  changeOperations: ChangeOperation[];
  autosaveStatus: 'SAVED' | 'SAVING' | 'UNSAVED';

  undoStack: Array<{
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
    changeOperations: ChangeOperation[];
  }>;
  redoStack: Array<{
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
    changeOperations: ChangeOperation[];
  }>;

  versions: Map<string, OrganizationSnapshot>;
  activeCompareVersion: string | null;
  compareReport: DiffReport | null;

  selectedOrgCode: string | null;
  selectedPositionId: string | null;
  searchQuery: string;
  validationResult: { valid: boolean; errors: string[]; warnings: string[] };

  // Actions
  initializeCurrentOrganization: () => Promise<void>;
  createDraft: (customName?: string) => void;
  switchToCurrent: () => void;
  switchToDraft: () => void;

  drillDownToOrg: (orgCode: string) => void;
  drillUpToParent: () => void;
  resetDrillDownToRoot: () => void;
  getBreadcrumbTrail: () => Array<{ code: string; name: string }>;
  getRollupStats: (orgCode: string) => { totalHeadcount: number; totalPositions: number; childUnitCount: number };

  // Domain Commands
  moveOrgUnit: (unitCode: string, newParentCode: string) => { success: boolean; error?: string };
  addOrgUnit: (data: { name: string; code: string; type: string; parentCode: string }) => { success: boolean; error?: string };
  closeOrgUnit: (unitCode: string, effectiveDate: string, reason?: string) => { success: boolean; error?: string };
  removeDraftUnit: (unitCode: string) => { success: boolean; error?: string };

  movePosition: (positionId: string, targetOrgUnitCode: string, newReportsToId?: string | null) => boolean;
  addPosition: (data: { orgUnitCode: string; title: string; code?: string }) => Position;
  closePosition: (positionId: string) => void;
  vacatePosition: (positionId: string) => void;

  moveEmployee: (employeeId: string, targetPositionId: string) => boolean;

  undo: () => void;
  redo: () => void;
  saveNamedVersion: (versionNumber: string) => OrganizationSnapshot;
  loadVersionSnapshot: (versionNumber: string) => void;
  compareWithVersion: (versionNumber: string) => DiffReport | null;

  setSearchQuery: (query: string) => void;
  setSelectedOrgCode: (code: string | null) => void;
  setSelectedPositionId: (id: string | null) => void;
  runValidation: () => void;
  persistDraftToLocalStorage: () => void;
  restoreDraftFromLocalStorage: () => boolean;
}

const DRAFT_STORAGE_KEY = 'orgflow_studio_working_draft_v1';

export const useOrgStore = create<OrgStoreState>()(
  immer((set, get) => ({
    viewMode: 'CURRENT_OFFICIAL',
    draftName: 'FY2027 Organization Plan',
    planName: 'Official Corporate Hierarchy (TTMET)',
    currentVersionName: 'Official Kintone Live',
    effectiveDate: '2026-08-23',
    sourceSnapshotMeta: null,
    currentRootOrgCode: null,

    orgUnits: [],
    positions: [],
    assignments: [],
    employees: [],
    officialBaseline: null,

    changeOperations: [],
    autosaveStatus: 'SAVED',

    undoStack: [],
    redoStack: [],

    versions: new Map(),
    activeCompareVersion: null,
    compareReport: null,

    selectedOrgCode: null,
    selectedPositionId: null,
    searchQuery: '',
    validationResult: { valid: true, errors: [], warnings: [] },

    initializeCurrentOrganization: async () => {
      let fetchedData: any = null;
      try {
        const resp = await fetch('http://127.0.0.1:4000/api/kintone/current-organization');
        if (resp.ok) {
          const json = await resp.json();
          if (json.success && json.data) {
            fetchedData = json;
          }
        }
      } catch {}

      if (fetchedData) {
        set(state => {
          state.sourceSnapshotMeta = fetchedData.meta;
          state.orgUnits = fetchedData.data.orgUnits;
          state.positions = fetchedData.data.positions;
          state.assignments = fetchedData.data.assignments;
          state.employees = fetchedData.data.employees;
          state.validationResult = fetchedData.validation;
          state.officialBaseline = {
            orgUnits: JSON.parse(JSON.stringify(fetchedData.data.orgUnits)),
            positions: JSON.parse(JSON.stringify(fetchedData.data.positions)),
            assignments: JSON.parse(JSON.stringify(fetchedData.data.assignments)),
            employees: JSON.parse(JSON.stringify(fetchedData.data.employees))
          };
          state.currentRootOrgCode = null;
        });
      } else {
        const rawEmployees = generate275EmployeesFixture();
        const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

        set(state => {
          state.sourceSnapshotMeta = {
            snapshotId: `snap-local-${Date.now()}`,
            loadedAt: new Date().toISOString(),
            mappingVersion: '2.0.0-canonical-57',
            treeHash: '741ec827543763109799440bc0c9fa80'
          };
          state.orgUnits = dataset.orgUnits;
          state.positions = dataset.positions;
          state.assignments = dataset.assignments;
          state.employees = dataset.employees;
          state.officialBaseline = {
            orgUnits: JSON.parse(JSON.stringify(dataset.orgUnits)),
            positions: JSON.parse(JSON.stringify(dataset.positions)),
            assignments: JSON.parse(JSON.stringify(dataset.assignments)),
            employees: JSON.parse(JSON.stringify(dataset.employees))
          };
          state.currentRootOrgCode = null;
          state.validationResult = validateOrganizationIntegrity(
            dataset.orgUnits,
            dataset.positions,
            dataset.assignments
          );
        });
      }
    },

    createDraft: (customName?: string) => {
      const { orgUnits, positions, assignments, employees } = get();
      const name = customName || 'FY2027 Organization Plan';

      set(state => {
        state.viewMode = 'DRAFT';
        state.draftName = name;
        state.currentVersionName = `Draft: ${name}`;
        state.orgUnits = JSON.parse(JSON.stringify(orgUnits));
        state.positions = JSON.parse(JSON.stringify(positions));
        state.assignments = JSON.parse(JSON.stringify(assignments));
        state.employees = JSON.parse(JSON.stringify(employees));
        state.changeOperations = [];
        state.undoStack = [];
        state.redoStack = [];
        state.currentRootOrgCode = null;
        state.autosaveStatus = 'SAVED';
      });
      get().persistDraftToLocalStorage();
    },

    switchToCurrent: () => {
      const { officialBaseline } = get();
      if (!officialBaseline) return;

      set(state => {
        state.viewMode = 'CURRENT_OFFICIAL';
        state.currentVersionName = 'Official Kintone Live';
        state.orgUnits = JSON.parse(JSON.stringify(officialBaseline.orgUnits));
        state.positions = JSON.parse(JSON.stringify(officialBaseline.positions));
        state.assignments = JSON.parse(JSON.stringify(officialBaseline.assignments));
        state.employees = JSON.parse(JSON.stringify(officialBaseline.employees));
        state.currentRootOrgCode = null;
      });
    },

    switchToDraft: () => {
      if (get().viewMode === 'DRAFT') return;
      if (!get().restoreDraftFromLocalStorage()) {
        get().createDraft();
      }
    },

    drillDownToOrg: (orgCode: string) => {
      set(state => {
        state.currentRootOrgCode = orgCode;
        state.selectedOrgCode = orgCode;
        state.selectedPositionId = null;
      });
    },

    drillUpToParent: () => {
      const { currentRootOrgCode, orgUnits } = get();
      if (!currentRootOrgCode) return;

      const current = orgUnits.find(o => o.code === currentRootOrgCode);
      set(state => {
        state.currentRootOrgCode = current?.parentCode || null;
        state.selectedOrgCode = current?.parentCode || null;
        state.selectedPositionId = null;
      });
    },

    resetDrillDownToRoot: () => {
      set(state => {
        state.currentRootOrgCode = null;
        state.selectedOrgCode = null;
        state.selectedPositionId = null;
      });
    },

    getBreadcrumbTrail: () => {
      const { currentRootOrgCode, orgUnits } = get();
      if (!currentRootOrgCode) {
        return [{ code: 'ALL', name: 'All Company Overview' }];
      }

      const trail: Array<{ code: string; name: string }> = [];
      let curr: string | null = currentRootOrgCode;

      while (curr) {
        const found = orgUnits.find(o => o.code === curr);
        if (found) {
          trail.unshift({ code: found.code, name: found.name });
          curr = found.parentCode;
        } else {
          break;
        }
      }

      trail.unshift({ code: 'ALL', name: 'All Company Overview' });
      return trail;
    },

    getRollupStats: (orgCode: string) => {
      const { orgUnits, positions, assignments } = get();

      const childCodes = new Set<string>([orgCode]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const org of orgUnits) {
          if (org.parentCode && childCodes.has(org.parentCode) && !childCodes.has(org.code)) {
            childCodes.add(org.code);
            changed = true;
          }
        }
      }

      const subtreePositions = positions.filter(p => childCodes.has(p.orgUnitCode) && p.lifecycle !== 'CLOSED');
      const posIds = new Set(subtreePositions.map(p => p.id));
      const activeAssignments = assignments.filter(a => posIds.has(a.positionId));

      return {
        totalHeadcount: activeAssignments.length,
        totalPositions: subtreePositions.length,
        childUnitCount: childCodes.size - 1
      };
    },

    moveOrgUnit: (unitCode: string, newParentCode: string) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      const check = canReparentOrgUnit(unitCode, newParentCode, orgUnits);
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];
      });

      const parentUnit = orgUnits.find(o => o.code === newParentCode);
      const targetUnit = orgUnits.find(o => o.code === unitCode);
      const oldParent = targetUnit?.parentCode || 'ROOT';

      set(state => {
        const u = state.orgUnits.find(o => o.code === unitCode);
        if (u) {
          u.parentCode = newParentCode;
          u.level = (parentUnit?.level || 1) + 1;
        }

        const op: ChangeOperation = {
          id: `CHG-${Date.now()}`,
          type: 'MOVE_ORG_UNIT',
          targetId: unitCode,
          targetName: targetUnit?.name || unitCode,
          from: oldParent,
          to: newParentCode,
          timestamp: new Date().toISOString()
        };
        state.changeOperations.push(op);
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return { success: true };
    },

    addOrgUnit: (data: { name: string; code: string; type: string; parentCode: string }) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      if (orgUnits.some(o => o.code.toUpperCase() === data.code.toUpperCase())) {
        return { success: false, error: `Organization Code "${data.code}" already exists in the company!` };
      }

      const parent = orgUnits.find(o => o.code === data.parentCode);
      if (!parent) {
        return { success: false, error: `Parent organization "${data.parentCode}" not found.` };
      }

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];
      });

      const newUnit: OrgUnit = {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        type: data.type,
        level: parent.level + 1,
        parentCode: data.parentCode,
        status: 'NEW',
        isDraftOnly: true,
        effectiveDate: new Date().toISOString().split('T')[0]
      };

      set(state => {
        state.orgUnits.push(newUnit);
        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'ADD_ORG_UNIT',
          targetId: newUnit.code,
          targetName: newUnit.name,
          to: newUnit.parentCode,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return { success: true };
    },

    closeOrgUnit: (unitCode: string, effectiveDate: string, reason?: string) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      const check = canCloseOrgUnit(unitCode, orgUnits, positions, assignments);
      if (!check.allowed) {
        return { success: false, error: check.reason };
      }

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];
      });

      set(state => {
        const u = state.orgUnits.find(o => o.code === unitCode);
        if (u) {
          u.status = 'CLOSING';
          u.effectiveDate = effectiveDate;
          u.closingReason = reason || 'Organizational restructuring';
        }

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'CLOSE_ORG_UNIT',
          targetId: unitCode,
          targetName: u?.name || unitCode,
          details: { effectiveDate, reason },
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
      });

      get().persistDraftToLocalStorage();
      return { success: true };
    },

    removeDraftUnit: (unitCode: string) => {
      const { orgUnits, positions, assignments, changeOperations } = get();
      const unit = orgUnits.find(o => o.code === unitCode);

      if (!unit || !unit.isDraftOnly) {
        return {
          success: false,
          error: `Cannot hard-delete official organization unit "${unitCode}". Use "Close Unit" instead.`
        };
      }

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];

        state.orgUnits = state.orgUnits.filter(o => o.code !== unitCode);
        state.positions = state.positions.filter(p => p.orgUnitCode !== unitCode);

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'REMOVE_DRAFT_UNIT',
          targetId: unitCode,
          targetName: unit.name,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.selectedOrgCode = null;
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return { success: true };
    },

    movePosition: (positionId: string, targetOrgUnitCode: string, newReportsToId: string | null = null) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      const posMap = new Map(positions.map(p => [p.id, p]));
      if (newReportsToId) {
        const cycle = detectCircularReporting(positionId, newReportsToId, posMap);
        if (cycle.hasCycle) {
          console.warn(`[OrgStore] Move blocked: Circular reporting detected: ${cycle.path.join(' -> ')}`);
          return false;
        }
      }

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];

        const targetPos = state.positions.find(p => p.id === positionId);
        const oldUnit = targetPos?.orgUnitCode;
        if (targetPos) {
          targetPos.orgUnitCode = targetOrgUnitCode;
          targetPos.reportsToPositionId = newReportsToId;
        }

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'MOVE_POSITION',
          targetId: positionId,
          targetName: targetPos?.title || positionId,
          from: oldUnit,
          to: targetOrgUnitCode,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return true;
    },

    addPosition: (data: { orgUnitCode: string; title: string; code?: string }) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];
      });

      const id = `pos-draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newPos: Position = {
        id,
        code: data.code || `POS-${Math.floor(100 + Math.random() * 900)}`,
        title: data.title,
        orgUnitCode: data.orgUnitCode,
        reportsToPositionId: null,
        lifecycle: 'VACANT',
        isDraftOnly: true
      };

      set(state => {
        state.positions.push(newPos);
        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'ADD_POSITION',
          targetId: newPos.id,
          targetName: newPos.title,
          to: newPos.orgUnitCode,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return newPos;
    },

    closePosition: (positionId: string) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];

        state.assignments = state.assignments.filter(a => a.positionId !== positionId);
        const pos = state.positions.find(p => p.id === positionId);
        if (pos) {
          pos.lifecycle = 'CLOSING';
        }

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'CLOSE_POSITION',
          targetId: positionId,
          targetName: pos?.title || positionId,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
    },

    moveEmployee: (employeeId: string, targetPositionId: string) => {
      const { orgUnits, positions, assignments, employees, changeOperations } = get();

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];
      });

      const emp = employees.find(e => e.id === employeeId);

      set(state => {
        const existingAsgIndex = state.assignments.findIndex(a => a.employeeId === employeeId);
        let previousPosId: string | null = null;

        if (existingAsgIndex >= 0) {
          previousPosId = state.assignments[existingAsgIndex].positionId;
          state.assignments.splice(existingAsgIndex, 1);
        }

        state.assignments.push({
          id: `asg-${Date.now()}-${employeeId}`,
          positionId: targetPositionId,
          employeeId,
          isPrimary: true
        });

        const targetPosInDraft = state.positions.find(p => p.id === targetPositionId);
        if (targetPosInDraft) {
          targetPosInDraft.lifecycle = 'ACTIVE';
        }

        if (previousPosId && previousPosId !== targetPositionId) {
          const remainingIncumbents = state.assignments.filter(a => a.positionId === previousPosId);
          if (remainingIncumbents.length === 0) {
            const prevPos = state.positions.find(p => p.id === previousPosId);
            if (prevPos) {
              prevPos.lifecycle = 'VACANT';
            }
          }
        }

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'MOVE_EMPLOYEE',
          targetId: employeeId,
          targetName: emp?.nameEN || employeeId,
          from: previousPosId,
          to: targetPositionId,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
      return true;
    },

    vacatePosition: (positionId: string) => {
      const { orgUnits, positions, assignments, changeOperations } = get();

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack = [];

        state.assignments = state.assignments.filter(a => a.positionId !== positionId);
        const pos = state.positions.find(p => p.id === positionId);
        if (pos) {
          pos.lifecycle = 'VACANT';
        }

        state.changeOperations.push({
          id: `CHG-${Date.now()}`,
          type: 'VACATE_POSITION',
          targetId: positionId,
          targetName: pos?.title || positionId,
          timestamp: new Date().toISOString()
        });
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
    },

    undo: () => {
      const { undoStack, orgUnits, positions, assignments, changeOperations } = get();
      if (undoStack.length === 0) return;

      const previousState = undoStack[undoStack.length - 1];

      set(state => {
        state.redoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.undoStack.pop();

        state.orgUnits = previousState.orgUnits;
        state.positions = previousState.positions;
        state.assignments = previousState.assignments;
        state.changeOperations = previousState.changeOperations;
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
    },

    redo: () => {
      const { redoStack, orgUnits, positions, assignments, changeOperations } = get();
      if (redoStack.length === 0) return;

      const nextState = redoStack[redoStack.length - 1];

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments)),
          changeOperations: JSON.parse(JSON.stringify(changeOperations))
        });
        state.redoStack.pop();

        state.orgUnits = nextState.orgUnits;
        state.positions = nextState.positions;
        state.assignments = nextState.assignments;
        state.changeOperations = nextState.changeOperations;
        state.autosaveStatus = 'SAVED';
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      get().persistDraftToLocalStorage();
    },

    saveNamedVersion: (versionNumber: string) => {
      const { planName, effectiveDate, orgUnits, positions, assignments, employees } = get();

      const snapshot: OrganizationSnapshot = {
        snapshotId: `snap-${versionNumber}-${Date.now()}`,
        versionId: `ver-${versionNumber}-${Date.now()}`,
        versionNumber,
        planName,
        createdAt: new Date().toISOString(),
        effectiveDate,
        orgUnits: JSON.parse(JSON.stringify(orgUnits)),
        positions: JSON.parse(JSON.stringify(positions)),
        assignments: JSON.parse(JSON.stringify(assignments)),
        employees: JSON.parse(JSON.stringify(employees)),
        treeHash: `hash-${Date.now()}`
      };

      set(state => {
        state.versions.set(versionNumber, snapshot);
      });

      return snapshot;
    },

    loadVersionSnapshot: (versionNumber: string) => {
      const snapshot = get().versions.get(versionNumber);
      if (!snapshot) return;

      set(state => {
        state.currentVersionName = `Version ${snapshot.versionNumber} [SNAPSHOT READ-ONLY]`;
        state.orgUnits = JSON.parse(JSON.stringify(snapshot.orgUnits));
        state.positions = JSON.parse(JSON.stringify(snapshot.positions));
        state.assignments = JSON.parse(JSON.stringify(snapshot.assignments));
        state.employees = JSON.parse(JSON.stringify(snapshot.employees));
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });
    },

    compareWithVersion: (versionNumber: string) => {
      const targetSnapshot = get().versions.get(versionNumber);
      if (!targetSnapshot) return null;

      const currentSnapshot: OrganizationSnapshot = {
        snapshotId: 'current-draft',
        versionId: 'current-draft',
        versionNumber: 'Current Draft',
        planName: get().planName,
        createdAt: new Date().toISOString(),
        effectiveDate: get().effectiveDate,
        orgUnits: get().orgUnits,
        positions: get().positions,
        assignments: get().assignments,
        employees: get().employees,
        treeHash: 'current'
      };

      const report = computeVersionDiff(targetSnapshot, currentSnapshot);

      set(state => {
        state.activeCompareVersion = versionNumber;
        state.compareReport = report;
      });

      return report;
    },

    setSearchQuery: (query: string) => {
      set(state => {
        state.searchQuery = query;
      });
    },

    setSelectedOrgCode: (code: string | null) => {
      set(state => {
        state.selectedOrgCode = code;
      });
    },

    setSelectedPositionId: (id: string | null) => {
      set(state => {
        state.selectedPositionId = id;
      });
    },

    runValidation: () => {
      set(state => {
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });
    },

    persistDraftToLocalStorage: () => {
      const { draftName, effectiveDate, orgUnits, positions, assignments, employees, changeOperations } = get();
      const payload = JSON.stringify({
        draftName,
        effectiveDate,
        orgUnits,
        positions,
        assignments,
        employees,
        changeOperations,
        savedAt: new Date().toISOString()
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, payload);
      }
    },

    restoreDraftFromLocalStorage: () => {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const dataStr = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!dataStr) return false;

      try {
        const parsed = JSON.parse(dataStr);
        set(state => {
          state.viewMode = 'DRAFT';
          state.draftName = parsed.draftName || 'FY2027 Organization Plan';
          state.currentVersionName = `Draft: ${state.draftName}`;
          state.effectiveDate = parsed.effectiveDate;
          state.orgUnits = parsed.orgUnits;
          state.positions = parsed.positions;
          state.assignments = parsed.assignments;
          state.employees = parsed.employees;
          state.changeOperations = parsed.changeOperations || [];
          state.currentRootOrgCode = null;
          state.autosaveStatus = 'SAVED';
          state.validationResult = validateOrganizationIntegrity(
            parsed.orgUnits,
            parsed.positions,
            parsed.assignments
          );
        });
        return true;
      } catch (err) {
        console.error('[OrgStore] Failed to restore draft from localStorage', err);
        return false;
      }
    }
  }))
);
