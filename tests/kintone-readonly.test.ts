import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../apps/api/src/server.js';
import { kintoneAdapter } from '../apps/api/src/modules/kintone/kintone.adapter.js';
import { EXCLUDED_SENSITIVE_FIELDS } from '../apps/api/src/modules/kintone/kintone.types.js';

describe('Phase 4 & 5: Kintone Read-Only & Production Foundation Test Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Health Check Endpoint & Safety Boundary
  it('GET /health returns healthy status with strict Kintone Write disabled flag', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('OrgFlow Studio API');
    expect(body.kintoneWriteEnabled).toBe(false); // Strict safety guarantee
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  // 2. Kintone Read-Only Adapter & Source Snapshot Metadata
  it('Loads current Kintone organization with immutable Source Snapshot metadata', async () => {
    const result = await kintoneAdapter.loadCurrentOrganization();

    expect(result.meta.snapshotId).toMatch(/^kintone-snap-/);
    expect(result.meta.loadedAt).toBeDefined();
    expect(result.meta.app53Count).toBe(275);
    expect(result.meta.app791Count).toBe(57);
    expect(result.meta.app792Count).toBe(275);
    expect(result.meta.treeHash).toHaveLength(64); // SHA-256 hash
    expect(result.orgUnits.length).toBe(64); // 57 Canonical + 7 Overlays
    expect(result.validation.valid).toBe(true);
    expect(result.validation.errors).toHaveLength(0);
    expect(result.invariants.orphanOrgCount).toBe(0);
  });

  // 3. API Endpoint GET /api/kintone/current-organization
  it('GET /api/kintone/current-organization delivers normalized domain models without sensitive fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/kintone/current-organization'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.orgUnits.length).toBe(64);
    expect(body.data.employees.length).toBe(275);

    // Verify sensitive fields are excluded from payload
    const firstEmp = body.data.employees[0];
    for (const field of EXCLUDED_SENSITIVE_FIELDS) {
      expect(firstEmp[field]).toBeUndefined();
    }
  });

  // 4. Invariant Headcount and Hierarchy Integrity
  it('Validates 100% hierarchy integrity with zero circular loops or orphan nodes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/kintone/current-organization'
    });

    const body = JSON.parse(res.payload);
    expect(body.invariants.canonicalCount).toBe(57);
    expect(body.invariants.overlayCount).toBe(7);
    expect(body.invariants.activeEmployees).toBe(275);
    expect(body.invariants.orphanOrgCount).toBe(0);
    expect(body.invariants.orphanPositionCount).toBe(0);
    expect(body.validation.valid).toBe(true);
  });
});