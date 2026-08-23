# React Flow Enterprise Organization Chart Skill

## Purpose
Design, construct, and optimize scalable, interactive enterprise organization chart canvases with smooth zoom, pan, dragging, and spatial isolation using `@xyflow/react`.

## When to Use
- Interactive organization design workspace.
- Visual position movement, employee reassignment, and reporting line inspection.

## When NOT to Use
- Pure batch CLI synchronization tasks.
- Static printable PDF rendering (use Vector Print Renderer).

## Recommended Pattern
1. Custom Node Architecture: Encapsulate Organization Units and internal Position Cards into compound custom React Flow nodes.
2. Canvas-Local Coordinate Arithmetic: Keep all drag/drop and vector math in 1:1 Canvas-Local Space to prevent CSS Zoom Transform distortion.
3. Decouple Layout Computation: Calculate layout coordinates asynchronously using ELK.js before feeding nodes to React Flow.

## Lessons Learned & Failed Approaches
- *Failed:* Rendering individual position cards as hundreds of disconnected React Flow nodes caused excessive DOM nodes and degraded performance.
- *Proven Solution:* Group positions inside their respective OrgUnit compound card, keeping React Flow node count equal to Org Units (64 nodes) while managing position interactions internally.

## Security Considerations
- Frontend components must never receive or process raw sensitive compensation or personal identification fields.
