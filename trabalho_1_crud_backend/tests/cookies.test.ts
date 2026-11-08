import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { usuario } from './helpers.js';

const ORIGEM = 'http://localhost:5173';

/** Cadastra, faz login e devolve o header `Set-Cookie` (lista) da resposta. */
async function login() {
  await request(app).post('/auth/register').send(usuario);
  const res = await request(app)
    .post('/auth/login')
    .send({ email: usuario.email, senha: usuario.senha });
  return { res, cookies: res.headers['set-cookie'] as unknown as string[] | undefined };
}

/** Converte `token=abc; Path=/; HttpOnly` em `token=abc`, o que o navegador devolve ao servidor. */
const soNomeValor = (cookies: string[]) => cookies[0].split(';')[0];

describe('POST /auth/login (cookie)', () => {
  it('grava o JWT em um cookie HttpOnly', async () => {
    const { res, cookies } = await login();
    expect(res.status).toBe(200);
    expect(cookies).toBeDefined();
    const cookie = cookies![0];
    expect(cookie).toMatch(/^token=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=\d+/i);
  });

  it('não define cookie quando as credenciais são inválidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nao@existe.com', senha: '123456' });
    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});

describe('autenticação por cookie', () => {
  it('permite acessar rota protegida só com o cookie', async () => {
    const { cookies } = await login();
    const res = await request(app).get('/grupos').set('Cookie', soNomeValor(cookies!));
    expect(res.status).toBe(200);
  });

  it('rejeita cookie com JWT inválido com 401', async () => {
    const res = await request(app).get('/grupos').set('Cookie', 'token=lixo');
    expect(res.status).toBe(401);
  });

  it('continua aceitando Authorization: Bearer (Swagger e clientes de API)', async () => {
    await login();
    const { body } = await request(app)
      .post('/auth/login')
      .send({ email: usuario.email, senha: usuario.senha });
    const res = await request(app).get('/grupos').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /auth/me', () => {
  it('devolve o usuário logado a partir do cookie, sem expor a senha', async () => {
    const { cookies } = await login();
    const res = await request(app).get('/auth/me').set('Cookie', soNomeValor(cookies!));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(usuario.email);
    expect(res.body.nome).toBe(usuario.nome);
    expect(res.body.senha).toBeUndefined();
  });

  it('responde 401 sem cookie', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('expira o cookie e responde 204', async () => {
    const { cookies } = await login();
    const res = await request(app).post('/auth/logout').set('Cookie', soNomeValor(cookies!));
    expect(res.status).toBe(204);
    const limpo = (res.headers['set-cookie'] as unknown as string[])[0];
    expect(limpo).toMatch(/^token=;/);
    expect(limpo).toMatch(/Expires=Thu, 01 Jan 1970/i);
    expect(limpo).toMatch(/HttpOnly/i);
  });

  it('é idempotente: funciona mesmo sem estar logado', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('CORS com credenciais', () => {
  it('libera a origem do frontend e permite cookies', async () => {
    const res = await request(app).get('/health').set('Origin', ORIGEM);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGEM);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('não libera origens desconhecidas', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://malicioso.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde ao preflight de PUT/DELETE com credenciais', async () => {
    const res = await request(app)
      .options('/tarefas/123')
      .set('Origin', ORIGEM)
      .set('Access-Control-Request-Method', 'DELETE');
    expect(res.headers['access-control-allow-origin']).toBe(ORIGEM);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-methods']).toMatch(/DELETE/);
  });
});
