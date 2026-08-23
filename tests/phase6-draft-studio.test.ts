import { describe, it, expect, beforeEach } from 'vitest';
import {
  canReparentOrgUnit,
  canCloseOrgUnit,
  validateOrganizationIntegrity,
  buildNormalizedDataset,
  OrgUnit,
  Position,
  Assignment,
  Employee
} from '@orgflow/domain';
import { CANONICAL_57_MASTER, generate275EmployeesFixture } from '../apps/web/src/data/baseline.js';
import { useOrgStore } from '../apps/web/src/store/orgStore.js';

describe('Phase 6 — Organization Studio: Safe Draft Editing Engine', () => {
  beforeEach(async () => {
    // Reset store before each test
    await useOrgStore.getState().initializeCurrentOrganization();
  });

  describe('1. Mode Boundary & Draft Initialization', () => {
    it('initializes in CURRENT_OFFICIAL mode with read-only baseline data', () => {
      const state = useOrgStore.getState();
      expect(state.viewMode).toBe('CURRENT_OFFICIAL');
      expect(state.orgUnits.length).toBe(64);
      expect(state.employees.length).toBe(275);
      expect(state.officialBaseline).not.toBeNull();
    });

    it('creates a fresh DRAFT workspace based on official snapshot without mutating baseline', () => {
      const store = useOrgStore.getState();
      store.createDraft('FY2027 Strategic Reorganization');

      const draftState = useOrgStore.getState();
      expect(draftState.viewMode).toBe('DRAFT');
      expect(draftState.draftName).toBe('FY2027 Strategic Reorganization');
      expect(draftState.changeOperations.length).toBe(0);
      expect(draftState.orgUnits.length).toBe(64);

      // Mutate draft
      draftState.addOrgUnit({
        code: 'NEW-TEST-UNIT',
        name: 'New Test Unit',
        type: 'DEPARTMENT',
        parentCode: 'TTMET'
      });

      expect(useOrgStore.getState().orgUnits.length).toBe(65);
      expect(useOrgStore.getState().officialBaseline?.orgUnits.length).toBe(64);

      // Switching back to official view restores read-only baseline
      useOrgStore.getState().switchToCurrent();
      expect(useOrgStore.getState().viewMode).toBe('CURRENT_OFFICIAL');
      expect(useOrgStore.getState().orgUnits.length).toBe(64);
    });
  });

  describe('2. Safe Organization Unit Operations (Reparenting, Add, Close, Remove)', () => {
    it('moves an organization unit under a valid parent and logs ChangeOperation', () => {
      useOrgStore.getState().createDraft();
      const res = useOrgStore.getState().moveOrgUnit('TMF1', 'TMT0');

      expect(res.success).toBe(true);
      const movedUnit = useOrgStore.getState().orgUnits.find(o => o.code === 'TMF1');
      expect(movedUnit?.parentCode).toBe('TMT0');

      const operations = useOrgStore.getState().changeOperations;
      expect(operations.length).toBe(1);
      expect(operations[0].type).toBe('MOVE_ORG_UNIT');
      expect(operations[0].targetId).toBe('TMF1');
      expect(operations[0].to).toBe('TMT0');
    });

    it('blocks moving an organization unit under itself', () => {
      useOrgStore.getState().createDraft();
      const res = useOrgStore.getState().moveOrgUnit('TMF0', 'TMF0');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot move organization unit "TMF0" under itself');
    });

    it('blocks moving a parent unit into its own descendant (anti-cycle check)', () => {
      useOrgStore.getState().createDraft();
      // 'TMF1' is a section inside department 'TMF0'
      const res = useOrgStore.getState().moveOrgUnit('TMF0', 'TMF1');

      expect(res.success).toBe(false);
      expect(res.error).toContain('already inside "TMF0"');
    });

    it('adds a new child unit in draft with NEW status', () => {
      useOrgStore.getState().createDraft();
      const res = useOrgStore.getState().addOrgUnit({
        code: 'ENG-LAB',
        name: 'AI Engineering Lab',
        type: 'SECTION',
        parentCode: 'TMF0'
      });

      expect(res.success).toBe(true);
      const added = useOrgStore.getState().orgUnits.find(o => o.code === 'ENG-LAB');
      expect(added).toBeDefined();
      expect(added?.status).toBe('NEW');
      expect(added?.isDraftOnly).toBe(true);
    });

    it('blocks closing an official organization unit if active incumbents remain', () => {
      useOrgStore.getState().createDraft();
      // 'TMF0' has child units and active employees
      const res = useOrgStore.getState().closeOrgUnit('TMF0', '2026-12-31', 'Downsizing');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Cannot close "TMF0" yet');
    });

    it('allows closing a vacant organization unit and marks CLOSING with effective date', () => {
      useOrgStore.getState().createDraft();
      // Add empty unit
      useOrgStore.getState().addOrgUnit({
        code: 'TEMP-DIV',
        name: 'Temporary Project Division',
        type: 'DIVISION',
        parentCode: 'TTMET'
      });

      const res = useOrgStore.getState().closeOrgUnit('TEMP-DIV', '2026-12-31', 'End of project');
      expect(res.success).toBe(true);

      const closed = useOrgStore.getState().orgUnits.find(o => o.code === 'TEMP-DIV');
      expect(closed?.status).toBe('CLOSING');
      expect(closed?.effectiveDate).toBe('2026-12-31');
    });

    it('allows hard-deleting draft-only units but blocks hard-deleting official Kintone units', () => {
      useOrgStore.getState().createDraft();

      // Attempt hard deletion of official unit
      const officialRes = useOrgStore.getState().removeDraftUnit('TMF0');
      expect(officialRes.success).toBe(false);
      expect(officialRes.error).toContain('Cannot hard-delete official organization unit');

      // Add draft unit and hard delete it
      useOrgStore.getState().addOrgUnit({
        code: 'SCRATCH-UNIT',
        name: 'Scratch Unit',
        type: 'SECTION',
        parentCode: 'TTMET'
      });

      expect(useOrgStore.getState().orgUnits.some(o => o.code === 'SCRATCH-UNIT')).toBe(true);

      const draftRes = useOrgStore.getState().removeDraftUnit('SCRATCH-UNIT');
      expect(draftRes.success).toBe(true);
      expect(useOrgStore.getState().orgUnits.some(o => o.code === 'SCRATCH-UNIT')).toBe(false);
    });
  });

  describe('3. Position & Employee Actions (Vacancy Rule & Reassignment)', () => {
    it('creates a new position with VACANT lifecycle in draft', () => {
      useOrgStore.getState().createDraft();
      const pos = useOrgStore.getState().addPosition({
        orgUnitCode: 'TMF0',
        title: 'Principal Automation Architect'
      });

      expect(pos.lifecycle).toBe('VACANT');
      expect(pos.orgUnitCode).toBe('TMF0');
      expect(pos.isDraftOnly).toBe(true);
    });

    it('moving an employee leaves the source position in state VACANT', () => {
      useOrgStore.getState().createDraft();

      const initialAssignments = useOrgStore.getState().assignments;

      // Find an active assignment
      const sourceAsg = initialAssignments[0];
      const sourcePosId = sourceAsg.positionId;
      const empId = sourceAsg.employeeId;

      // Create target vacancy
      const targetPos = useOrgStore.getState().addPosition({
        orgUnitCode: 'TMF0',
        title: 'New Lead Engineer'
      });

      // Move employee to target position
      const success = useOrgStore.getState().moveEmployee(empId, targetPos.id);
      expect(success).toBe(true);

      // Verify target position is active with employee
      const updatedAsg = useOrgStore.getState().assignments.find(a => a.employeeId === empId);
      expect(updatedAsg?.positionId).toBe(targetPos.id);

      // Verify source position became VACANT
      const sourcePos = useOrgStore.getState().positions.find(p => p.id === sourcePosId);
      expect(sourcePos?.lifecycle).toBe('VACANT');
    });

    it('vacating a position unassigns the employee and marks position VACANT', () => {
      useOrgStore.getState().createDraft();
      const asg = useOrgStore.getState().assignments[0];
      const posId = asg.positionId;

      useOrgStore.getState().vacatePosition(posId);

      const pos = useOrgStore.getState().positions.find(p => p.id === posId);
      expect(pos?.lifecycle).toBe('VACANT');

      const remainingAsg = useOrgStore.getState().assignments.find(a => a.positionId === posId);
      expect(remainingAsg).toBeUndefined();
    });
  });

  describe('4. Undo / Redo & State Integrity', () => {
    it('supports full Undo and Redo across consecutive organizational modifications', () => {
      useOrgStore.getState().createDraft();
      const initialCount = useOrgStore.getState().orgUnits.length;

      // 1. Add unit
      useOrgStore.getState().addOrgUnit({
        code: 'ALPHA',
        name: 'Alpha Team',
        type: 'TEAM',
        parentCode: 'TTMET'
      });
      expect(useOrgStore.getState().orgUnits.length).toBe(initialCount + 1);

      // 2. Add another unit
      useOrgStore.getState().addOrgUnit({
        code: 'BETA',
        name: 'Beta Team',
        type: 'TEAM',
        parentCode: 'TTMET'
      });
      expect(useOrgStore.getState().orgUnits.length).toBe(initialCount + 2);

      // 3. Undo step 2
      useOrgStore.getState().undo();
      expect(useOrgStore.getState().orgUnits.length).toBe(initialCount + 1);
      expect(useOrgStore.getState().orgUnits.some(o => o.code === 'BETA')).toBe(false);

      // 4. Undo step 1
      useOrgStore.getState().undo();
      expect(useOrgStore.getState().orgUnits.length).toBe(initialCount);
      expect(useOrgStore.getState().orgUnits.some(o => o.code === 'ALPHA')).toBe(false);

      // 5. Redo step 1
      useOrgStore.getState().redo();
      expect(useOrgStore.getState().orgUnits.length).toBe(initialCount + 1);
      expect(useOrgStore.getState().orgUnits.some(o => o.code === 'ALPHA')).toBe(true);
    });

    it('maintains 100% hierarchy integrity throughout draft mutations', () => {
      useOrgStore.getState().createDraft();

      // Perform a series of moves and additions
      useOrgStore.getState().addOrgUnit({
        code: 'UNIT-X',
        name: 'Unit X',
        type: 'DEPARTMENT',
        parentCode: 'TTMET'
      });
      useOrgStore.getState().moveOrgUnit('TMF1', 'UNIT-X');

      const validation = validateOrganizationIntegrity(
        useOrgStore.getState().orgUnits,
        useOrgStore.getState().positions,
        useOrgStore.getState().assignments
      );

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });
});
