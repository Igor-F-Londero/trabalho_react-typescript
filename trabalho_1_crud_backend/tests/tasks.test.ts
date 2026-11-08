import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { auth, criarTokenDe } from './helpers.js';

const idInexistente = '665f1c2e9b1e8a0012345678';

let token: string;
beforeEach(async () => {
  token = await criarTokenDe();
});

const criar = (dados: object = { titulo: 'Estudar Express' }, t = token) =>
  request(app).post('/tarefas').set(auth(t)).send(dados);

describe('autenticação das rotas', () => {
  it('retorna 401 sem token', async () => {
    expect((await request(app).get('/tarefas')).status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    expect((await request(app).get('/tarefas').set(auth('lixo'))).status).toBe(401);
  });
});

describe('POST /tarefas', () => {
  it('cria tarefa com valores padrão', async () => {
    const res = await criar();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      titulo: 'Estudar Express',
      status: 'pendente',
      prioridade: 'media',
    });
  });

  it('rejeita título curto e status inválido', async () => {
    const res = await criar({ titulo: 'ab', status: 'xyz' });
    expect(res.status).toBe(400);
  });
});

describe('GET /tarefas', () => {
  it('lista e filtra por status', async () => {
    await criar({ titulo: 'Tarefa A' });
    await criar({ titulo: 'Tarefa B', status: 'concluida' });
    const todas = await request(app).get('/tarefas').set(auth(token));
    const concluidas = await request(app).get('/tarefas?status=concluida').set(auth(token));
    expect(todas.body).toHaveLength(2);
    expect(concluidas.body).toHaveLength(1);
    expect(concluidas.body[0].titulo).toBe('Tarefa B');
  });

  it('não mostra tarefas de outro usuário', async () => {
    await criar();
    const outro = await criarTokenDe({ nome: 'João', email: 'joao@email.com', senha: '123456' });
    const res = await request(app).get('/tarefas').set(auth(outro));
    expect(res.body).toEqual([]);
  });
});

describe('GET /tarefas/:id', () => {
  it('consulta por id', async () => {
    const { body } = await criar();
    const res = await request(app).get(`/tarefas/${body._id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(body._id);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get(`/tarefas/${idInexistente}`).set(auth(token));
    expect(res.status).toBe(404);
  });

  it('retorna 400 para id malformado', async () => {
    const res = await request(app).get('/tarefas/abc').set(auth(token));
    expect(res.status).toBe(400);
  });

  it('retorna 404 para tarefa de outro usuário', async () => {
    const { body } = await criar();
    const outro = await criarTokenDe({ nome: 'João', email: 'joao@email.com', senha: '123456' });
    const res = await request(app).get(`/tarefas/${body._id}`).set(auth(outro));
    expect(res.status).toBe(404);
  });
});

describe('PUT /tarefas/:id', () => {
  it('atualiza parcialmente e persiste', async () => {
    const { body } = await criar();
    const res = await request(app)
      .put(`/tarefas/${body._id}`)
      .set(auth(token))
      .send({ status: 'em_andamento' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_andamento');
    expect(res.body.titulo).toBe('Estudar Express');
    const again = await request(app).get(`/tarefas/${body._id}`).set(auth(token));
    expect(again.body.status).toBe('em_andamento');
  });

  it('rejeita corpo vazio e valores inválidos com 400', async () => {
    const { body } = await criar();
    const vazio = await request(app).put(`/tarefas/${body._id}`).set(auth(token)).send({});
    const ruim = await request(app)
      .put(`/tarefas/${body._id}`)
      .set(auth(token))
      .send({ prioridade: 'x' });
    expect(vazio.status).toBe(400);
    expect(ruim.status).toBe(400);
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app)
      .put(`/tarefas/${idInexistente}`)
      .set(auth(token))
      .send({ titulo: 'Novo título' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /tarefas/:id', () => {
  it('exclui e depois retorna 404', async () => {
    const { body } = await criar();
    const del = await request(app).delete(`/tarefas/${body._id}`).set(auth(token));
    expect(del.status).toBe(204);
    const get = await request(app).get(`/tarefas/${body._id}`).set(auth(token));
    expect(get.status).toBe(404);
  });

  it('retorna 404 ao excluir inexistente', async () => {
    const res = await request(app).delete(`/tarefas/${idInexistente}`).set(auth(token));
    expect(res.status).toBe(404);
  });
});
