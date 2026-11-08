import request from 'supertest';
import { app } from '../src/app.js';

export const usuario = { nome: 'Maria', email: 'maria@email.com', senha: '123456' };

export async function criarTokenDe(u = usuario) {
  await request(app).post('/auth/register').send(u);
  const res = await request(app).post('/auth/login').send({ email: u.email, senha: u.senha });
  return res.body.token as string;
}

/** Cabeçalho `Authorization: Bearer` para as chamadas autenticadas dos testes. */
export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
