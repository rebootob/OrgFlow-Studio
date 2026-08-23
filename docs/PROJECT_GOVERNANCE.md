# ==============================================================================
# OrgFlow Studio — Mandatory Development & Security Governance
# ==============================================================================

## 1. Core Principles
- **Easy to Develop · Easy to Customize · Easy to Use · Hard to Make a Dangerous Mistake**
- **Search -> Reuse -> Modify -> Create Only If Necessary**
- **Zero Sensitive Data in GitHub**
- **Immutable Historical Versions & Approvals**
- **Single Source of Truth for Business Rules**

## 2. Anti-Sprawl & File Governance
1. **Never create versioned filenames** (`*_v2`, `*_new`, `*_fix`, `*_final`, `*_backup`).
2. **Git is the version control system.** Use commits and checkpoints.
3. **Cohesive modules over fragmentation.** Avoid 1-function-per-file sprawl and deep directory nesting.
4. **New File Creation Gate:** Must specify why existing modules cannot be modified.

## 3. Continuous Skill & Knowledge Capture (`skills/`)
- Capture reusable patterns, layout math, security mitigations, and failed approach lessons.
- Every skill must follow the standard specification and update `skills/README.md`.
- No sensitive data, tokens, passwords, or employee data in skills.

## 4. Definition of Done
- Implementation -> Tests -> Security Review -> Data Integrity Review -> Code Hygiene Review -> Documentation -> Skill Capture -> Git Diff Review -> Commit -> Backup.
