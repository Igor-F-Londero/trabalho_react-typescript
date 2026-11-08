import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { auth, criarTokenDe } from './helpers.js';

const idInexistente = '665f1c2e9b1e8a0012345678';

let token: string;
beforeEach(async () => {
  token = await criarTokenDe();
});

const criarGrupo = (nome: string, pai?: string | null, t = token) =>
  request(app).post('/grupos').set(auth(t)).send({ nome, pai });
const criarTarefa = (grupo?: string | null, titulo = 'Tarefa teste') =>
  request(app).post('/tarefas').set(auth(token)).send({ titulo, grupo });

describe('POST /grupos', () => {
  it('cria grupo raiz e subgrupo', async () => {
    const pai = await criarGrupo('Faculdade');
    expect(pai.status).toBe(201);
    expect(pai.body.pai).toBeNull();
    const filho = await criarGrupo('Matéria 1', pai.body._id);
    expect(filho.status).toBe(201);
    expect(filho.body.pai).toBe(pai.body._id);
  });

  it('rejeita pai inexistente (404), pai malformado e nome curto (400)', async () => {
    expect((await criarGrupo('Faculdade', idInexistente)).status).toBe(404);
    expect((await criarGrupo('Faculdade', 'abc')).status).toBe(400);
    expect((await criarGrupo('x')).status).toBe(400);
  });

  it('não aceita pai de outro usuário', async () => {
    const pai = await criarGrupo('Faculdade');
    const outro = await criarTokenDe({ nome: 'João', email: 'joao@email.com', senha: '123456' });
    expect((await criarGrupo('Intruso', pai.body._id, outro)).status).toBe(404);
  });
});

describe('tarefas dentro de grupos', () => {
  it('cria tarefa em grupo e filtra por grupo', async () => {
    const g = await criarGrupo('Faculdade');
    await criarTarefa(g.body._id, 'Dentro');
    await criarTarefa(null, 'Fora');
    const dentro = await request(app).get(`/tarefas?grupo=${g.body._id}`).set(auth(token));
    const fora = await request(app).get('/tarefas?grupo=nenhum').set(auth(token));
    expect(dentro.body.map((t: { titulo: string }) => t.titulo)).toEqual(['Dentro']);
    expect(fora.body.map((t: { titulo: string }) => t.titulo)).toEqual(['Fora']);
  });

  it('rejeita grupo inexistente e permite mover tarefa entre grupos', async () => {
    expect((await criarTarefa(idInexistente)).status).toBe(404);
    const a = await criarGrupo('Grupo A');
    const b = await criarGrupo('Grupo B');
    const t = await criarTarefa(a.body._id);
    const res = await request(app)
      .put(`/tarefas/${t.body._id}`)
      .set(auth(token))
      .send({ grupo: b.body._id });
    expect(res.body.grupo).toBe(b.body._id);
    const solta = await request(app)
      .put(`/tarefas/${t.body._id}`)
      .set(auth(token))
      .send({ grupo: null });
    expect(solta.body.grupo).toBeNull();
  });
});

describe('GET /grupos/arvore', () => {
  it('monta Faculdade > Matéria 1/Matéria 2 com tarefas', async () => {
    const fac = await criarGrupo('Faculdade');
    const m1 = await criarGrupo('Matéria 1', fac.body._id);
    const m2 = await criarGrupo('Matéria 2', fac.body._id);
    await criarTarefa(m1.body._id, 'Prova 1');
    await criarTarefa(m2.body._id, 'Trabalho 2');
    await criarTarefa(null, 'Solta');

    const res = await request(app).get('/grupos/arvore').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.grupos).toHaveLength(1);
    const raiz = res.body.grupos[0];
    expect(raiz.nome).toBe('Faculdade');
    expect(raiz.subgrupos.map((s: { nome: string }) => s.nome)).toEqual(['Matéria 1', 'Matéria 2']);
    expect(raiz.subgrupos[0].tarefas[0].titulo).toBe('Prova 1');
    expect(res.body.tarefasSemGrupo[0].titulo).toBe('Solta');
  });
});

describe('PUT /grupos/:id', () => {
  it('move grupo para outro pai', async () => {
    const a = await criarGrupo('Grupo A');
    const b = await criarGrupo('Grupo B');
    const res = await request(app)
      .put(`/grupos/${b.body._id}`)
      .set(auth(token))
      .send({ pai: a.body._id });
    expect(res.status).toBe(200);
    expect(res.body.pai).toBe(a.body._id);
  });

  it('impede ciclos (em si mesmo e em descendente)', async () => {
    const a = await criarGrupo('Grupo A');
    const b = await criarGrupo('Grupo B', a.body._id);
    const c = await criarGrupo('Grupo C', b.body._id);
    const emSi = await request(app)
      .put(`/grupos/${a.body._id}`)
      .set(auth(token))
      .send({ pai: a.body._id });
    const emNeto = await request(app)
      .put(`/grupos/${a.body._id}`)
      .set(auth(token))
      .send({ pai: c.body._id });
    expect(emSi.status).toBe(400);
    expect(emNeto.status).toBe(400);
  });
});

describe('DELETE /grupos/:id', () => {
  it('exclui grupo vazio', async () => {
    const g = await criarGrupo('Vazio');
    expect((await request(app).delete(`/grupos/${g.body._id}`).set(auth(token))).status).toBe(204);
  });

  it('retorna 409 se não vazio e preserva os dados', async () => {
    const g = await criarGrupo('Cheio');
    await criarTarefa(g.body._id);
    const res = await request(app).delete(`/grupos/${g.body._id}`).set(auth(token));
    expect(res.status).toBe(409);
    expect((await request(app).get(`/grupos/${g.body._id}`).set(auth(token))).status).toBe(200);
  });

  it('com cascata=true remove subgrupos e tarefas', async () => {
    const pai = await criarGrupo('Pai');
    const filho = await criarGrupo('Filho', pai.body._id);
    await criarTarefa(filho.body._id);
    const res = await request(app).delete(`/grupos/${pai.body._id}?cascata=true`).set(auth(token));
    expect(res.status).toBe(204);
    expect((await request(app).get(`/grupos/${filho.body._id}`).set(auth(token))).status).toBe(404);
    expect((await request(app).get('/tarefas').set(auth(token))).body).toEqual([]);
  });

  it('retorna 404 para grupo inexistente', async () => {
    expect((await request(app).delete(`/grupos/${idInexistente}`).set(auth(token))).status).toBe(
      404,
    );
  });
});

describe('profundidade máxima da hierarquia', () => {
  async function cadeia(niveis: number) {
    const ids: string[] = [];
    for (let i = 0; i < niveis; i++) {
      const res = await criarGrupo(`Nível ${i + 1}`, ids[i - 1] ?? null);
      expect(res.status).toBe(201);
      ids.push(res.body._id);
    }
    return ids;
  }

  it('recusa criar o 11º nível', async () => {
    const ids = await cadeia(10);
    const res = await criarGrupo('Fundo demais', ids[9]);
    expect(res.status).toBe(400);
  });

  it('recusa mover uma subárvore que estouraria o limite, mas aceita quando cabe', async () => {
    const ids = await cadeia(9);
    const ramo = await criarGrupo('Ramo');
    await criarGrupo('Filho do ramo', ramo.body._id); // ramo tem altura 1 (2 níveis)
    const mover = (pai: string) =>
      request(app).put(`/grupos/${ramo.body._id}`).set(auth(token)).send({ pai });
    expect((await mover(ids[8])).status).toBe(400); // 9 + 2 = 11
    expect((await mover(ids[7])).status).toBe(200); // 8 + 2 = 10
  });
});

describe('GET /health', () => {
  it('responde 200 com o banco conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
