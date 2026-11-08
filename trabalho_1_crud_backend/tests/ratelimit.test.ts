import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { criarAuthLimiter } from '../src/middlewares/rateLimit.js';
import { criarAuthRoutes } from '../src/routes/auth.routes.js';
import { usuario } from './helpers.js';

/** App mínimo só com as rotas de /auth e um limite baixo, ativo mesmo em ambiente de teste. */
function appComLimite(limit: number) {
  const mini = express();
  mini.use(cookieParser());
  mini.use(express.json());
  mini.use('/auth', criarAuthRoutes(criarAuthLimiter({ limit, skip: () => false })));
  mini.use(errorHandler);
  return mini;
}

const loginErrado = (app: express.Express) =>
  request(app).post('/auth/login').send({ email: 'nao@existe.com', senha: '123456' });

describe('limite de tentativas em /auth', () => {
  it('bloqueia o login com 429 e uma mensagem clara depois do limite', async () => {
    const app = appComLimite(3);
    for (let i = 0; i < 3; i++) expect((await loginErrado(app)).status).toBe(401);

    const res = await loginErrado(app);
    expect(res.status).toBe(429);
    expect(res.body.erro).toBe('Muitas tentativas. Tente novamente mais tarde.');
  });

  it('o cadastro divide o mesmo limite do login (quem erra senha não pode contornar criando contas)', async () => {
    const app = appComLimite(2);
    await loginErrado(app);
    await loginErrado(app);
    const res = await request(app).post('/auth/register').send(usuario);
    expect(res.status).toBe(429);
  });

  it('GET /auth/me não entra na conta: o frontend o chama a cada carregamento da página', async () => {
    const app = appComLimite(2);
    for (let i = 0; i < 6; i++) expect((await request(app).get('/auth/me')).status).toBe(401);
  });

  it('POST /auth/logout também não entra na conta', async () => {
    const app = appComLimite(2);
    for (let i = 0; i < 6; i++) expect((await request(app).post('/auth/logout')).status).toBe(204);
  });

  it('quem esgotou o limite do login ainda consegue checar a sessão e sair', async () => {
    const app = appComLimite(1);
    await loginErrado(app);
    expect((await loginErrado(app)).status).toBe(429);

    expect((await request(app).get('/auth/me')).status).toBe(401);
    expect((await request(app).post('/auth/logout')).status).toBe(204);
  });
});
