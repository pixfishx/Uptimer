import { Hono } from 'hono';

import { getDb, monitors } from '@uptimer/db';

import type { Env } from './env';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('ok'));

app.get('/api/v1/public/health', async (c) => {
  // Minimal DB touch to verify the Worker can connect to D1.
  const db = getDb(c.env);
  await db.select({ id: monitors.id }).from(monitors).limit(1).all();
  return c.json({ ok: true });
});

export default app;
