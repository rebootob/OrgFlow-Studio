# Skill: Safe Draft Editing & Domain Command Architecture

## Domain Overview
OrgFlow Studio decouples Official Kintone Data from HR Working Drafts. Under no circumstances should organizational drafting or structural testing mutate live Kintone application data.

## Core Architectural Patterns

### 1. Immutable Baseline vs. Working Draft Workspace
- **Current Mode**: Holds the immutable `SourceSnapshot` loaded from Kintone App 53/791/792. It is strictly read-only (`🔒 Read Only`).
- **Draft Mode**: Initializes a deep clone of the canonical structure. All operations are recorded into a persistent `changeOperations` array.

### 2. Domain Command Pattern
Every user action is dispatched as a discrete domain command with immediate validation:
- `MOVE_ORG_UNIT`: Reparents an organization unit. Rejects self-reparenting and descendant cycles.
- `ADD_ORG_UNIT`: Creates a child unit marked with `status: 'NEW'` and `isDraftOnly: true`.
- `CLOSE_ORG_UNIT`: Official Kintone units cannot be deleted. If active staff or positions remain, the close action is blocked. When vacated, sets `status: 'CLOSING'` with an effective date.
- `REMOVE_DRAFT_UNIT`: Only draft-created units (`isDraftOnly: true`) are allowed to be removed completely.
- `MOVE_EMPLOYEE`: Reassigns an employee to a target position. The vacancy rule automatically marks the source position as `VACANT`.
- `VACATE_POSITION`: Unassigns the employee and flags the position as open for HR allocation.

### 3. Anti-Cycle Validation Algorithm
```typescript
export function canReparentOrgUnit(
  unitCode: string,
  newParentCode: string,
  orgUnits: OrgUnit[]
): { allowed: boolean; reason?: string } {
  if (unitCode === newParentCode) {
    return { allowed: false, reason: `Cannot move unit "${unitCode}" under itself.` };
  }

  const descendantCodes = new Set<string>([unitCode]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const org of orgUnits) {
      if (org.parentCode && descendantCodes.has(org.parentCode) && !descendantCodes.has(org.code)) {
        descendantCodes.add(org.code);
        changed = true;
      }
    }
  }

  if (descendantCodes.has(newParentCode)) {
    return {
      allowed: false,
      reason: `Cannot move "${unitCode}" under "${newParentCode}" because "${newParentCode}" is inside "${unitCode}".`
    };
  }

  return { allowed: true };
}
```

### 4. Position Independence (Positions Exist Independently of People)
Positions are the stable architectural skeleton of an organization. Moving or vacating an employee preserves the position entity with `lifecycle: 'VACANT'`, preventing structural collapse and enabling vacant headcount reporting.
