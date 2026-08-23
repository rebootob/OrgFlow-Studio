# HR Organization Chart UX & Readability Skill

## Purpose
Design intuitive, friendly, and readable organization chart experiences tailored specifically for HR professionals, avoiding cognitive overload while maintaining complete topology integrity.

## Core UX Principles
1. **Light & Calm Theme:** Soft neutral backgrounds (`bg-slate-50`), rounded cards, gentle borders, and subtle shadows create a professional corporate atmosphere.
2. **Progressive Disclosure:** Primary nodes on the canvas display only essential information (Position Title, Incumbent Name, Employee Code, Department). Detailed metadata (reports to, contact info, lifecycle) is revealed in a dedicated **Right Detail Panel** on click.
3. **Search-to-Focus Workflow:** Searching an employee or position instantly highlights the result and animates the React Flow viewport (`setCenter` with zoom ~1.0) directly to the target card without manual hunting.
4. **Collapsible Workspace:** Sidebars and detail drawers can collapse smoothly to maximize canvas screen estate on standard 1080p laptop/desktop displays.
5. **Clear Semantic Colors:** Green for active/healthy, amber for vacancies, blue for selections, and red strictly for validation errors.