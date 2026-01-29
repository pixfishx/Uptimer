import { createMiddleware } from 'hono/factory';

import type { Env } from '../env';
import { AppError } from './errors';

export const requireAdmin = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const token = c.env.ADMIN_TOKEN;
  if (!token) {
    throw new AppError(500, 'INTERNAL', 'Admin token not configured');
  }

  const auth = c.req.header('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  await next();
});
