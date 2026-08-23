# HR Organization Chart UX & Readability Skill

## Purpose
Design intuitive, friendly, and readable organization chart experiences tailored specifically for HR professionals, avoiding cognitive overload while maintaining complete topology integrity.

## Core UX Principles

### 1. Summary on Canvas, Detail on Demand
- **Canvas Nodes**: Function as high-level summary cards (Organization Unit, Leader/Head, and aggregate metrics). Standardized card width (`280px`) with **zero internal scrollbars**.
- **Right Detail Panel**: Acts as the comprehensive information area (complete position roster, employee codes, status, and draft modification actions).

### 2. Multi-Density View Modes
To support different executive and operational contexts without changing underlying data:
- **Overview Mode**: Executive high-level view showing only Unit Name, Code/Type, and Staff/Position/Vacancy counts. Allows fitting maximum units on screen.
- **Organization Mode (Default HR View)**: Standard view showing Unit Name, Type, Head/Leader with Position title (or `VACANT LEADER` / `Head not defined`), and summary metrics bar.
- **People Mode**: Same compact card footprint with a preview of up to 2-3 key personnel plus a `+ N more` indicator.

### 3. Progressive Disclosure & Focus Branch
- **Focus Branch / Drill-Down**: Double-clicking a unit or clicking `[ Drill in › ]` isolates the selected subtree and its direct reporting branches, updating the breadcrumb trail.
- **Search-to-Focus Workflow**: Searching an employee or position highlights the result, auto-resets drill down if needed, and animates the React Flow viewport (`setCenter` with zoom ~1.1).

### 4. Gentle Semantic Indicators
- **Vacancies**: Represented by a gentle amber badge `⚠ N Vacancy` without turning the entire card orange.
- **Draft Status**: Small discrete badges (`NEW`, `CLOSING`) distinguish draft changes from official Kintone baseline data.
