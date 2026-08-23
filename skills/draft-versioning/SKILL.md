# Draft & Immutable Version Snapshot Skill

## Purpose
Manage multiple drafting copies, undo/redo states, immutable named versions, and version-to-version diffing.

## Core Rules
1. Position-Based Model: Positions exist independently of employees. Moving an employee leaves the position with status `VACANT` (never delete historical positions).
2. Immutable Snapshot: Named versions store a complete frozen snapshot. Opening V1 in the future must reflect V1 exactly without recalculation.
3. Approval Non-Inheritance: Modifying or cloning an approved version creates a new Draft that requires fresh approval.
4. Diff Engine: Generate exact delta operations (moved staff, vacated positions, reporting changes) between any two snapshots.
