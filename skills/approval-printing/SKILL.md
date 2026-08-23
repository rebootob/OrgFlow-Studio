# Approval Printing & PDF Generation Skill

## Purpose
Generate formal, crisp, executive-ready A3 Landscape proposal packages with verifiable Document IDs, approval workflows, and deterministic layout integrity.

## Core Architectural Patterns

### 1. Vector A3 Landscape Generation
- **Target Dimensions**: ISO A3 Landscape (1191.6 x 842.4 pt / 420 x 297 mm).
- **Pure Vector Text & Connectors**: Using `pdf-lib` ensures 100% crisp typography and infinite zoom fidelity without rasterization artifacts or screenshot degradation.

### 2. Standardized Document Framing
Every formal corporate organization chart package contains:
- **Header**: Company branding (`TTMET`), Document title (`ORGANIZATION CHART 2026`), and BCP Office governance box.
- **Leadership Header**: Board of Directors roster and Managing Director / President executive node.
- **Division Grouping Panels**:
  - Machinery & Engineering Division (`DIV-ME`) in green semantic theme.
  - GIFU SEIKI Division (`DIV-G0`) in orange/beige semantic theme.
  - Corporate Department (`TMH0`) in blue semantic theme.
- **Overlay Layers**: Support Marketing (`SPMKT`) cross-divisional matrix row.
- **Approval & Signature Block**: Prepared By, Reviewed By, Approved By, Signatures, Revision number (`Rev. 2 / 2026`), and Effective Date (`5 May 2026`).
- **Employee Headcount Table**: Breakdown by branch (Head Office, Amata 1, Amata 2 GIFU) and headcount categories.

### 3. Data-First Print Hierarchy
- The print layout separates print presentation from interactive web canvas constraints, maintaining 100% data fidelity with the canonical domain models while maximizing paper readability.
