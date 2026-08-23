# ELK.js Organization Hierarchy Layout Skill

## Purpose
Compute stable, non-overlapping 2D layered coordinates for deep, non-uniform enterprise organization structures.

## When to Use
- Automatic hierarchical positioning of organization units.
- Re-layout after position/department transfer.

## Recommended Pattern
- Algorithm: `elk.algorithm: layered`
- Direction: `DOWN` (Top-to-Bottom)
- Node Placement Strategy: `BRANDES_KOEPF` for balanced, aesthetic subtree centering.
- Dynamic Node Sizing: Compute each OrgUnit node height dynamically based on the count of child positions.

## Performance
- 64 Units with 275 positions computed in ~140ms in pure WebAssembly/JS runtime.
