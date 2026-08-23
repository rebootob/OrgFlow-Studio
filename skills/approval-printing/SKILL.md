# Approval Printing & PDF Generation Skill

## Purpose
Generate formal, crisp, executive-ready A4/A3 proposal packages with verifiable Document IDs and cryptographic hashes.

## Recommended Pattern
- Deterministic Vector / Semantic Print: Render structured vector tables, SVG connectors, and clear typography with CSS `@media print` and server-side Headless Chromium.
- Reject Canvas Screenshots: Screen capture degrades text legibility on large charts and produces unreadable A4 prints.
- Multi-page Partitioning: Large enterprises should partition printable pages by Division/Department rather than shrinking the entire enterprise onto a single illegible sheet.
