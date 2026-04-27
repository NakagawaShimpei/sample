import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(__dirname, '../../data/audit.log');

const SKIP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_METHODS.has(req.method)) {
    next();
    return;
  }

  const originalEnd = res.end.bind(res);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).end = function (...args: Parameters<typeof originalEnd>) {
    const entry = {
      timestamp: new Date().toISOString(),
      user: req.user?.username ?? 'anonymous',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      body: sanitizeBody(req.body),
    };
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(LOG_PATH, line, () => {/* fire-and-forget */});

    return originalEnd(...args);
  };

  next();
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const copy = { ...(body as Record<string, unknown>) };
  if ('password' in copy) copy['password'] = '***';
  return copy;
}
