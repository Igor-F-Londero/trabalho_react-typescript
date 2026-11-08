import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const COOKIE_NAME = 'token';

/** O JWT vem do cookie HttpOnly (frontend) ou de `Authorization: Bearer` (Swagger e clientes de API). */
function extrairToken(req: Parameters<RequestHandler>[0]) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[COOKIE_NAME] as string | undefined;
}

/** Se o token for válido, grava o id do usuário (campo `sub`) em `req.userId`. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = extrairToken(req);
  if (!token) return next(new AppError(401, 'Token não informado'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.userId = String(payload.sub);
    next();
  } catch {
    next(new AppError(401, 'Token inválido ou expirado'));
  }
};
