# Application Security & Zero-Secret Architecture Skill

## Purpose
Protect corporate HR data, credentials, and API access boundaries through defense-in-depth architectural controls.

## Core Rules
1. Zero Secrets in Client: Frontend bundle must never contain API tokens, passwords, database URIs, or encryption keys.
2. Server-Side Security Headers: Fastify registers `@fastify/helmet` to protect HTTP transport and prevent clickjacking.
3. CORS Restriction: API endpoints restrict access strictly to whitelisted frontend origins.
4. Rate Limiting: Built-in request throttling (`@fastify/rate-limit`) prevents brute-force abuse.
5. Environment Safety: Environment variables are strictly validated at boot time via Zod schemas.

## Sensitive Data in Git Prevention
- `.gitignore` blocks `.env*`, `*.sqlite`, `*.db`, `*.csv`, `*.xlsx`, `*.pdf`, and backup directories.
- Automated tests verify that sensitive employee fields are absent from API JSON responses.