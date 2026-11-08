import type { CookieOptions, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { COOKIE_NAME } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';

// HttpOnly: o JavaScript do navegador não lê o cookie (protege contra roubo por XSS).
// SameSite=Lax: não é enviado em requisições POST/PUT/DELETE vindas de outros sites (protege contra CSRF).
const cookieBase: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/',
};

// Controllers só traduzem HTTP <-> service: sem regra de negócio.
export const register: RequestHandler = async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(user);
};

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body);
  // O cookie dura o mesmo que o JWT (lido do `exp` do próprio token).
  const { exp } = jwt.decode(result.token) as { exp: number };
  res.cookie(COOKIE_NAME, result.token, { ...cookieBase, maxAge: exp * 1000 - Date.now() });
  res.json(result);
};

export const me: RequestHandler = async (req, res) => {
  res.json(await authService.getById(req.userId));
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieBase);
  res.status(204).end();
};
