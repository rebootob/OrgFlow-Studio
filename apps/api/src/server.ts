import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { organizationRoutes } from './routes/organization.js';

export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  });

  // 1. Security Headers (Helmet)
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  // 2. CORS Restriction (Frontend port 3010 and localhost)
  await fastify.register(cors, {
    origin: [env.CORS_ORIGIN, 'http://localhost:3010', 'http://127.0.0.1:3010', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  });

  // 3. Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // 4. Register Routes
  await fastify.register(healthRoutes);
  await fastify.register(organizationRoutes);

  // 5. Global Error Handler
  fastify.setErrorHandler((error: any, _request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred'
    });
  });

  return fastify;
}

async function start() {
  try {
    const server = await createServer();
    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`[OrgFlow Studio API] Server listening on http://${env.HOST}:${env.PORT}`);
    console.log(`[OrgFlow Security] KINTONE_WRITE_ENABLED = ${env.KINTONE_WRITE_ENABLED} (STRICT READ-ONLY)`);
  } catch (err) {
    console.error('Failed to start OrgFlow API server', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}