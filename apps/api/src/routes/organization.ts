import { FastifyPluginAsync } from 'fastify';
import { kintoneAdapter } from '../modules/kintone/kintone.adapter.js';

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/kintone/current-organization
   * Loads current Official Kintone data, normalizes into OrgFlow domain,
   * performs integrity checks, and returns a verified Source Snapshot.
   * STRICTLY READ-ONLY.
   */
  fastify.get('/api/kintone/current-organization', async (request, reply) => {
    try {
      const data = await kintoneAdapter.loadCurrentOrganization();
      return reply.send({
        success: true,
        meta: data.meta,
        invariants: data.invariants,
        validation: data.validation,
        data: {
          orgUnits: data.orgUnits,
          positions: data.positions,
          assignments: data.assignments,
          employees: data.employees
        }
      });
    } catch (err: any) {
      fastify.log.error(err, 'Failed to fetch and normalize Kintone organization data');
      return reply.status(500).send({
        success: false,
        error: 'Failed to load official organization data from Kintone',
        message: err.message || 'Internal Server Error'
      });
    }
  });
};