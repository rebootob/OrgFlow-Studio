# Draft & Immutable Version Snapshot Skill

## Purpose
Manage multiple drafting copies, undo/redo states, immutable named versions, and version-to-version diffing.

## Core Rules
1. Position-Based Model: Positions exist independently of employees. Moving an employee leaves the position with status `VACANT` (never delete historical positions).
2. Immutable Snapshot: Named versions store a complete frozen snapshot. Opening V1 in the future must reflect V1 exactly without recalculation.
3. Approval Non-Inheritance: Modifying or cloning an approved version creates a new Draft that requires fresh approval.
4. Diff Engine: Generate exact delta operations (moved staff, vacated positions, reporting changes) between any two snapshots.
5. Organization Display Policy & Display Snapshots:
   - Data Completeness vs Visual Completeness: OrgFlow tracks 100% of employees, positions, and assignments. Chart visibility is purely presentation metadata.
   - Precedence: Explicit Position Override (`SHOW`/`HIDE`) > Verified Presentation Mapping > AUTO Rule.
   - HIDE means hidden from chart canvas/print cards; it never means delete, ignore, or exclude from search, headcount, validation, or version snapshots.
   - Named Versions in Phase 7 must snapshot resolved display metadata so future versions reproduce identical print/visual states.
