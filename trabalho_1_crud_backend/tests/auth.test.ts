import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { usuario } from './helpers.js';

describe('POST /auth/register', () => {
  it('cadastra usuário sem expor a senha', async () => {
    const res = await request(app).post('/auth/register').send(usuario);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(usuario.email);
    expect(res.body.senha).toBeUndefined();
  });

  it('rejeita e-mail duplicado com 409', async () => {
    await request(app).post('/auth/register').send(usuario);
    const res = await request(app).post('/auth/register').send(usuario);
    expect(res.status).toBe(409);
  });

  it('rejeita dados inválidos com 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nome: 'M', email: 'invalido', senha: '1' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes).toHaveLength(3);
  });
});

describe('POST /auth/login', () => {
  it('retorna token com credenciais corretas', async () => {
    await request(app).post('/auth/register').send(usuario);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: usuario.email, senha: usuario.senha });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejeita senha incorreta com 401', async () => {
    await request(app).post('/auth/register').send(usuario);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: usuario.email, senha: 'errada' });
    expect(res.status).toBe(401);
  });

  it('rejeita usuário inexistente com 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nao@existe.com', senha: '123456' });
    expect(res.status).toBe(401);
  });

  it('rejeita corpo sem campos com 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
