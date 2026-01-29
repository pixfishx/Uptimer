import { Hono } from 'hono';

import { getDb, monitors } from '@uptimer/db';

import type { Env } from '../env';

export const publicRoutes = new Hono<{ Bindings: Env }>();

publicRoutes.get('/status', (c) => {
  const now = Math.floor(Date.now() / 1000);
  // Placeholder until Phase 5 (data-backed public status).
  return c.json({ generated_at: now, overall_status: 'unknown', monitors: [] });
});

publicRoutes.get('/health', async (c) => {
  // Minimal DB touch to verify the Worker can connect to D1.
  const db = getDb(c.env);
  await db.select({ id: monitors.id }).from(monitors).limit(1).all();
  return c.json({ ok: true });
});
