import { Router, type RequestHandler } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

/**
 * Só `/login` e `/register` passam pelo limite de tentativas (contra força bruta, por IP, dividindo a mesma cota).
 * `/me` e `/logout` ficam de fora: o frontend chama `/me` a cada carregamento de página, e contá-lo trancaria
 * o usuário comum para fora do app depois de algumas recargas.
 */
export function criarAuthRoutes(limiter: RequestHandler = authLimiter) {
  const rotas = Router();
  rotas.post('/register', limiter, validateBody(registerSchema), controller.register);
  rotas.post('/login', limiter, validateBody(loginSchema), controller.login);
  rotas.post('/logout', controller.logout);
  rotas.get('/me', authenticate, controller.me);
  return rotas;
}

export const authRoutes = criarAuthRoutes();
