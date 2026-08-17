import { Request, Response, NextFunction } from 'express';
import { validate as validateUUID } from 'uuid';

// Simple dev auth middleware: reads X-User-Id header and attaches userId to req
// Production: replace with JWT middleware that validates tokens and sets req.userId = token.sub
export function devAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('x-user-id') || req.header('X-User-Id');
  if (!header) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Missing x-user-id header' },
      timestamp: new Date().toISOString(),
    });
  }

  if (!validateUUID(header)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'INVALID_USER_ID', message: 'x-user-id must be a valid UUID' },
      timestamp: new Date().toISOString(),
    });
  }

  // attach to request
  (req as any).userId = header;
  next();
}
