# Kintone Read-Only Integration & Normalization Skill

## Purpose
Safely read, batch-fetch, sanitize, and normalize corporate enterprise data from Cybozu Kintone Apps (App 53, App 791, App 792) into the OrgFlow domain model with zero mutation guarantees.

## When to Use
- Loading current official corporate organization state into OrgFlow Studio.
- Creating verifiable baseline Source Snapshots for conflict detection and revision auditing.

## When NOT to Use
- In-browser direct client requests (never call Kintone from the frontend).
- Automatic write / sync operations.

## Architecture Boundary
```text
Kintone REST API (App 53, 791, 792)
            │ HTTPS (Server-Side Only)
            ▼
    KintoneReadOnlyClient (Batch limit=500, Cursor Pagination, Exclude Sensitive Fields)
            │ Raw Kintone Payloads
            ▼
    KintoneAdapter (Metadata, Snapshot ID, Checksum, Revision Tracking)
            │ Normalization
            ▼
    OrgFlow Domain Model (OrgUnit, Position, Assignment, EmployeeCache)
```

## Field Mapping Dictionary
- **App 53 (Employee Master):** `emp_text` (ID), `Text_0` (Name TH), `Text` (Name EN), `Text_1` (Nickname), `Drop_down_0` (Dept), `Text_2` (Position), `Radio_button` (Branch).
- **Sensitive Field Omission:** Fields like `salary`, `citizen_id`, and `bank_account` are explicitly stripped at the query parameter level and never ingested into domain memory or transmitted to the client.

## Safety Controls
- `KINTONE_WRITE_ENABLED=false` is enforced at the environment config layer.
- Zero write routes exist during Read-Only phases.