import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { auth, criarTokenDe } from './helpers.js';

const outroUsuario = { nome: 'João', email: 'joao@email.com', senha: '123456' };

let token: string;
beforeEach(async () => {
  token = await criarTokenDe();
});

const criar = (dados: object, t = token) => request(app).post('/tarefas').set(auth(t)).send(dados);
const resumo = (query = '', t = token) =>
  request(app).get(`/tarefas/resumo-mensal${query}`).set(auth(t));

/** Março: alta concluída + 2 baixas pendentes. Abril: 1 média concluída + 1 média pendente. */
async function popular() {
  await criar({
    titulo: 'Alta março',
    prioridade: 'alta',
    status: 'concluida',
    prazo: '2026-03-10',
  });
  await criar({ titulo: 'Baixa 1', prioridade: 'baixa', prazo: '2026-03-20' });
  await criar({
    titulo: 'Baixa 2',
    prioridade: 'baixa',
    status: 'em_andamento',
    prazo: '2026-03-31',
  });
  await criar({
    titulo: 'Média feita',
    prioridade: 'media',
    status: 'concluida',
    prazo: '2026-04-01',
  });
  await criar({ titulo: 'Média aberta', prioridade: 'media', prazo: '2026-04-30' });
}

describe('GET /tarefas/resumo-mensal', () => {
  it('exige autenticação', async () => {
    expect((await request(app).get('/tarefas/resumo-mensal')).status).toBe(401);
  });

  it('sem tarefas devolve meses vazios e totais zerados', async () => {
    const res = await resumo();
    expect(res.status).toBe(200);
    expect(res.body.meses).toEqual([]);
    expect(res.body.geral).toMatchObject({
      total: 0,
      concluidas: 0,
      taxa: 0,
      taxaPonderada: 0,
      semPrazo: 0,
    });
  });

  it('informa os pesos usados no cálculo', async () => {
    expect((await resumo()).body.pesos).toEqual({ alta: 3, media: 2, baixa: 1 });
  });

  it('agrupa por mês do prazo, em ordem cronológica', async () => {
    await popular();
    const { meses } = (await resumo()).body;
    expect(meses.map((m: { mes: string }) => m.mes)).toEqual(['2026-03', '2026-04']);
    expect(meses[0]).toMatchObject({ total: 3, concluidas: 1 });
    expect(meses[1]).toMatchObject({ total: 2, concluidas: 1 });
  });

  it('o prazo no último dia do mês fica no mês certo (sem escorregar por fuso)', async () => {
    await popular();
    const marco = (await resumo()).body.meses[0];
    expect(marco.total).toBe(3); // inclui 2026-03-31
  });

  it('detalha total e concluídas por prioridade', async () => {
    await popular();
    const [marco] = (await resumo()).body.meses;
    expect(marco.prioridades).toEqual({
      alta: { total: 1, concluidas: 1 },
      media: { total: 0, concluidas: 0 },
      baixa: { total: 2, concluidas: 0 },
    });
  });

  it('calcula a taxa simples e a média ponderada pela prioridade de cada mês', async () => {
    await popular();
    const [marco, abril] = (await resumo()).body.meses;
    // março: simples 1/3; ponderada (3*1) / (3*1 + 1*2) = 3/5
    expect(marco.taxa).toBe(33.3);
    expect(marco.taxaPonderada).toBe(60);
    // abril: 1/2 nos dois cálculos, pois só há prioridade média
    expect(abril.taxa).toBe(50);
    expect(abril.taxaPonderada).toBe(50);
  });

  it('calcula o geral sobre todas as tarefas do período, não a média das taxas mensais', async () => {
    await popular();
    const { geral } = (await resumo()).body;
    expect(geral.total).toBe(5);
    expect(geral.concluidas).toBe(2);
    expect(geral.taxa).toBe(40);
    // (3*1 + 2*1) / (3*1 + 1*2 + 2*2) = 5/9
    expect(geral.taxaPonderada).toBe(55.6);
    expect(geral.mediaTarefasPorMes).toBe(2.5);
    expect(geral.mediaConcluidasPorMes).toBe(1);
  });

  it('deixa de fora as tarefas sem prazo, mas informa quantas são', async () => {
    await popular();
    await criar({ titulo: 'Sem prazo', status: 'concluida' });
    const { geral, meses } = (await resumo()).body;
    expect(geral.total).toBe(5);
    expect(geral.semPrazo).toBe(1);
    expect(meses).toHaveLength(2);
  });

  it('filtra por ano', async () => {
    await popular();
    await criar({ titulo: 'Ano passado', status: 'concluida', prazo: '2025-12-15' });
    const de2026 = (await resumo('?ano=2026')).body;
    expect(de2026.geral.total).toBe(5);
    const de2025 = (await resumo('?ano=2025')).body;
    expect(de2025.meses.map((m: { mes: string }) => m.mes)).toEqual(['2025-12']);
    expect(de2025.geral.total).toBe(1);
  });

  it('só considera as tarefas do próprio usuário', async () => {
    await popular();
    const outro = await criarTokenDe(outroUsuario);
    await criar({ titulo: 'Do João', status: 'concluida', prazo: '2026-03-05' }, outro);
    expect((await resumo()).body.geral.total).toBe(5);
    expect((await resumo('', outro)).body.geral.total).toBe(1);
  });

  it.each(['?ano=abc', '?ano=1800', '?ano=2026.5'])(
    'rejeita ano inválido (%s) com 400',
    async (q) => {
      expect((await resumo(q)).status).toBe(400);
    },
  );

  it('não confunde a rota com GET /tarefas/:id', async () => {
    const res = await resumo();
    expect(res.status).toBe(200);
    expect(res.body.erro).toBeUndefined();
  });
});
