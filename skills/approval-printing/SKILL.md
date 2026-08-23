# Approval Printing & PDF Generation Skill

## Purpose
Generate formal, crisp, executive-ready A3 Landscape proposal packages with verifiable Document IDs, approval workflows, and deterministic layout integrity matching corporate visual governance.

## Core Architectural Rules & Lessons Learned

### 1. Reference PDF as Layout Guidance vs Domain Authority
- **Reference PDF**: Serves as the visual composition, level representation, and spatial balance baseline.
- **OrgFlow Domain Truth**: Always authoritative for organization units, positions, employee assignments, vacancies, and headcount. Current domain data is never modified to mimic static historical documents.

### 2. Pure Vector A3 Landscape Generation
- **Target Dimensions**: ISO A3 Landscape (`1191.6 x 842.4 pt` / `420 x 297 mm`).
- **Typography**: Base-14 Helvetica / Helvetica-Bold ensures zero font missing issues, zero rasterization blur, and instant vector rendering.
- **Half-Pixel Snapping**: Coordinate snapping (`X + 0.5`, `Y + 0.5`) ensures crisp $0.75\text{ pt}$ vector stroke rendering without anti-aliasing fuzziness or micro-diagonals.

### 3. Pipeline Order & Mathematical Connector Pipeline
Connectors are calculated strictly **after** final node bounding boxes are determined:
$$\text{Node Layout} \longrightarrow \text{Collision / Packing} \longrightarrow \text{Final Node Bounding Boxes} \longrightarrow \text{Connector Calculation} \longrightarrow \text{PDF Stream Generation}$$

- **One Shared Rail Pattern**:
  - $\text{Parent Stem}: (\text{parent.centerX}, \text{parent.bottom}) \longrightarrow (\text{parent.centerX}, \text{railY})$
  - $\text{Horizontal Rail}: (\min(\text{child.centerX}), \text{railY}) \longrightarrow (\max(\text{child.centerX}), \text{railY})$
  - $\text{Child Drops}: (\text{child.centerX}, \text{railY}) \longrightarrow (\text{child.centerX}, \text{child.top})$
- **Zero Duplicate Geometry**: Explicit prohibition against manual or redundant vertical drops that overlap distribution rails.

### 4. Subtree-Based Width Allocation & Collision Safety
- Dense branches receive proportional horizontal space based on subtree requirements:
  $$\text{Branch Width} = \max(\text{Parent Min Width}, \sum \text{Child Widths} + \text{Gaps})$$
- Multi-team branches in single-width columns utilize vertical card stacking (`Team` $\rightarrow$ `Chief (P1)` $\rightarrow$ `Staff (P2)`) with a minimum 5 pt vertical clearance.

### 5. Level Guide (M1 / M2 / M3 / M4 / P1 / P2)
- Far-left vertical axis provides clear business level guides horizontally aligned with each hierarchy tier:
  - `M1`: President / Managing Director
  - `M2`: Divisions (`DIV-ME`, `DIV-G0`, `TMH0`) & Departments (`TMT0`, `TMF0`, `TME0`, `TMS0`, `TMG0`)
  - `M3`: Section Managers (`TMT1`–`TMH3`)
  - `M4`: Functional Teams & Sub-Units
  - `P1`: Chiefs, Senior Engineers, and Leads
  - `P2`: Staff, Engineers, Technicians, Operators, and Vacancies

### 6. Presentation Overlays vs Canonical Hierarchy
- **Support Marketing (`SPMKT`)**: Rendered as a dedicated bottom-left cross-divisional matrix row visually tied to operating units without distorting canonical domain parent-child trees.
- **Dynamic Headcount Reconciliation Assertion**: Programmatically asserts that $\text{Printed Total Active Staff} == \text{Calculated Domain Headcount}$ (e.g. 275 active staff). If mismatched, PDF generation fails immediately.
