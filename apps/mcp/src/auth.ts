import { Request, Response, NextFunction } from 'express';
import { env } from '@discord-agent/commons';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Health check is public
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).send({ error: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== env.MCP_SECRET) {
    return res.status(403).send({ error: 'Invalid authentication token' });
  }

  next();
}
