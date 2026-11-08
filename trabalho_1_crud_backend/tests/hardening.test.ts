import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { auth, criarTokenDe, usuario } from './helpers.js';

let token: string;
beforeEach(async () => {
  token = await criarTokenDe();
});

describe('validação de query', () => {
  it('GET /grupos rejeita ?pai inválido com 400', async () => {
    const res = await request(app).get('/grupos?pai=abc').set(auth(token));
    expect(res.status).toBe(400);
  });

  it('GET /grupos aceita ?pai=raiz', async () => {
    const res = await request(app).get('/grupos?pai=raiz').set(auth(token));
    expect(res.status).toBe(200);
  });

  it('GET /tarefas rejeita grupo, status e prioridade inválidos com 400', async () => {
    for (const q of ['grupo=abc', 'status=xyz', 'prioridade=xyz']) {
      const res = await request(app).get(`/tarefas?${q}`).set(auth(token));
      expect(res.status, q).toBe(400);
    }
  });

  it('DELETE /grupos/:id rejeita ?cascata inválido com 400', async () => {
    const res = await request(app)
      .delete('/grupos/665f1c2e9b1e8a0012345678?cascata=talvez')
      .set(auth(token));
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/register concorrente', () => {
  it('devolve 409 (não 500) para cadastros simultâneos do mesmo e-mail', async () => {
    await User.init();
    const novo = { ...usuario, email: 'corrida@email.com' };
    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post('/auth/register').send(novo)),
    );
    const status = respostas.map((r) => r.status).sort();
    expect(status.filter((s) => s === 201)).toHaveLength(1);
    expect(status.filter((s) => s === 409)).toHaveLength(4);
  });
});

describe('helmet', () => {
  it('envia cabeçalhos de segurança', async () => {
    const res = await request(app).get('/rota-inexistente');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('paginação', () => {
  it('pagina tarefas e informa o total nos cabeçalhos', async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post('/tarefas')
        .set(auth(token))
        .send({ titulo: `Tarefa ${i}` });
    }
    const res = await request(app).get('/tarefas?pagina=2&limite=2').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.headers['x-total-count']).toBe('5');
    expect(res.headers['x-page']).toBe('2');
    expect(res.headers['x-limit']).toBe('2');
    const ultima = await request(app).get('/tarefas?pagina=3&limite=2').set(auth(token));
    expect(ultima.body).toHaveLength(1);
  });

  it('pagina grupos e rejeita valores inválidos com 400', async () => {
    for (const nome of ['Aa', 'Bb', 'Cc']) {
      await request(app).post('/grupos').set(auth(token)).send({ nome });
    }
    const res = await request(app).get('/grupos?limite=2').set(auth(token));
    expect(res.body).toHaveLength(2);
    expect(res.headers['x-total-count']).toBe('3');
    for (const q of ['pagina=0', 'limite=101', 'limite=abc']) {
      const r = await request(app).get(`/grupos?${q}`).set(auth(token));
      expect(r.status, q).toBe(400);
    }
  });
});

describe('movimentos concorrentes de grupos', () => {
  it('nunca deixa dois grupos formarem ciclo', async () => {
    for (let rodada = 0; rodada < 5; rodada++) {
      const a = (await request(app).post('/grupos').set(auth(token)).send({ nome: 'AA' })).body;
      const b = (await request(app).post('/grupos').set(auth(token)).send({ nome: 'BB' })).body;
      const [r1, r2] = await Promise.all([
        request(app).put(`/grupos/${a._id}`).set(auth(token)).send({ pai: b._id }),
        request(app).put(`/grupos/${b._id}`).set(auth(token)).send({ pai: a._id }),
      ]);
      for (const r of [r1, r2]) expect([200, 400, 409]).toContain(r.status);
      const ga = (await request(app).get(`/grupos/${a._id}`).set(auth(token))).body;
      const gb = (await request(app).get(`/grupos/${b._id}`).set(auth(token))).body;
      expect(ga.pai === b._id && gb.pai === a._id).toBe(false);
    }
  });
});
