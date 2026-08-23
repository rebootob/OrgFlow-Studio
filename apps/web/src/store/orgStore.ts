import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  OrgUnit,
  Position,
  Assignment,
  Employee,
  OrganizationSnapshot,
  DiffReport,
  validateOrganizationIntegrity,
  computeVersionDiff,
  detectCircularReporting,
  buildNormalizedDataset
} from '@orgflow/domain';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../data/baseline.js';

export interface OrgStoreState {
  planName: string;
  currentVersionName: string;
  effectiveDate: string;
  orgUnits: OrgUnit[];
  positions: Position[];
  assignments: Assignment[];
  employees: Employee[];

  undoStack: Array<{
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
  }>;
  redoStack: Array<{
    orgUnits: OrgUnit[];
    positions: Position[];
    assignments: Assignment[];
  }>;

  versions: Map<string, OrganizationSnapshot>;
  activeCompareVersion: string | null;
  compareReport: DiffReport | null;

  selectedOrgCode: string | null;
  selectedPositionId: string | null;
  searchQuery: string;
  validationResult: { valid: boolean; errors: string[]; warnings: string[] };

  initializeBaseline: () => void;
  moveEmployee: (employeeId: string, targetPositionId: string) => boolean;
  movePosition: (positionId: string, targetOrgUnitCode: string, newReportsToId?: string | null) => boolean;
  createPosition: (orgUnitCode: string, title: string) => Position;
  vacatePosition: (positionId: string) => void;
  undo: () => void;
  redo: () => void;
  saveNamedVersion: (versionNumber: string) => OrganizationSnapshot;
  loadVersionSnapshot: (versionNumber: string) => void;
  compareWithVersion: (versionNumber: string) => DiffReport | null;
  setSearchQuery: (query: string) => void;
  setSelectedOrgCode: (code: string | null) => void;
  setSelectedPositionId: (id: string | null) => void;
  runValidation: () => void;
  persistToLocalStorage: () => void;
  restoreFromLocalStorage: () => boolean;
}

const STORAGE_KEY = 'orgflow_studio_draft_v1';

export const useOrgStore = create<OrgStoreState>()(
  immer((set, get) => ({
    planName: 'FY2027 Organization Restructure',
    currentVersionName: 'DRAFT (Working Copy)',
    effectiveDate: '2027-01-01',
    orgUnits: [],
    positions: [],
    assignments: [],
    employees: [],

    undoStack: [],
    redoStack: [],

    versions: new Map(),
    activeCompareVersion: null,
    compareReport: null,

    selectedOrgCode: null,
    selectedPositionId: null,
    searchQuery: '',
    validationResult: { valid: true, errors: [], warnings: [] },

    initializeBaseline: () => {
      const rawEmployees = generate275EmployeesFixture();
      const dataset = buildNormalizedDataset(CANONICAL_57_MASTER, rawEmployees, true);

      set(state => {
        state.orgUnits = dataset.orgUnits;
        state.positions = dataset.positions;
        state.assignments = dataset.assignments;
        state.employees = dataset.employees;
        state.undoStack = [];
        state.redoStack = [];
        state.validationResult = validateOrganizationIntegrity(
          dataset.orgUnits,
          dataset.positions,
          dataset.assignments
        );
      });
    },

    moveEmployee: (employeeId: string, targetPositionId: string) => {
      const { orgUnits, positions, assignments } = get();

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments))
        });
        state.redoStack = [];
      });

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

        const targetPos = state.positions.find(p => p.id === targetPositionId);
        if (targetPos) {
          targetPos.lifecycle = 'ACTIVE';
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

        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      return true;
    },

    movePosition: (positionId: string, targetOrgUnitCode: string, newReportsToId: string | null = null) => {
      const { orgUnits, positions, assignments } = get();

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
          assignments: JSON.parse(JSON.stringify(assignments))
        });
        state.redoStack = [];

        const targetPos = state.positions.find(p => p.id === positionId);
        if (targetPos) {
          targetPos.orgUnitCode = targetOrgUnitCode;
          targetPos.reportsToPositionId = newReportsToId;
        }

        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      return true;
    },

    createPosition: (orgUnitCode: string, title: string) => {
      const id = `pos-draft-${Date.now()}`;
      const newPos: Position = {
        id,
        code: `POS-NEW-${Math.floor(100 + Math.random() * 900)}`,
        title,
        orgUnitCode,
        reportsToPositionId: null,
        lifecycle: 'VACANT'
      };

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(state.orgUnits)),
          positions: JSON.parse(JSON.stringify(state.positions)),
          assignments: JSON.parse(JSON.stringify(state.assignments))
        });
        state.redoStack = [];

        state.positions.push(newPos);
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });

      return newPos;
    },

    vacatePosition: (positionId: string) => {
      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(state.orgUnits)),
          positions: JSON.parse(JSON.stringify(state.positions)),
          assignments: JSON.parse(JSON.stringify(state.assignments))
        });
        state.redoStack = [];

        state.assignments = state.assignments.filter(a => a.positionId !== positionId);
        const pos = state.positions.find(p => p.id === positionId);
        if (pos) {
          pos.lifecycle = 'VACANT';
        }

        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });
    },

    undo: () => {
      const { undoStack, orgUnits, positions, assignments } = get();
      if (undoStack.length === 0) return;

      const previousState = undoStack[undoStack.length - 1];

      set(state => {
        state.redoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments))
        });
        state.undoStack.pop();

        state.orgUnits = previousState.orgUnits;
        state.positions = previousState.positions;
        state.assignments = previousState.assignments;
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });
    },

    redo: () => {
      const { redoStack, orgUnits, positions, assignments } = get();
      if (redoStack.length === 0) return;

      const nextState = redoStack[redoStack.length - 1];

      set(state => {
        state.undoStack.push({
          orgUnits: JSON.parse(JSON.stringify(orgUnits)),
          positions: JSON.parse(JSON.stringify(positions)),
          assignments: JSON.parse(JSON.stringify(assignments))
        });
        state.redoStack.pop();

        state.orgUnits = nextState.orgUnits;
        state.positions = nextState.positions;
        state.assignments = nextState.assignments;
        state.validationResult = validateOrganizationIntegrity(
          state.orgUnits,
          state.positions,
          state.assignments
        );
      });
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

    persistToLocalStorage: () => {
      const { planName, effectiveDate, orgUnits, positions, assignments, employees } = get();
      const payload = JSON.stringify({
        planName,
        effectiveDate,
        orgUnits,
        positions,
        assignments,
        employees,
        savedAt: new Date().toISOString()
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, payload);
      }
    },

    restoreFromLocalStorage: () => {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const dataStr = window.localStorage.getItem(STORAGE_KEY);
      if (!dataStr) return false;

      try {
        const parsed = JSON.parse(dataStr);
        set(state => {
          state.planName = parsed.planName;
          state.effectiveDate = parsed.effectiveDate;
          state.orgUnits = parsed.orgUnits;
          state.positions = parsed.positions;
          state.assignments = parsed.assignments;
          state.employees = parsed.employees;
          state.validationResult = validateOrganizationIntegrity(
            parsed.orgUnits,
            parsed.positions,
            parsed.assignments
          );
        });
        return true;
      } catch (err) {
        console.error('[OrgStore] Failed to restore from localStorage', err);
        return false;
      }
    }
  }))
);
