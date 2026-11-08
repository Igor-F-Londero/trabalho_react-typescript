import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { Task } from '../src/models/Task.js';
import { arvore, caminhosDosGrupos, gerarHistorico } from '../src/seed-dados.js';
import { monthly } from '../src/services/summary.service.js';

// Domingo, 8 de novembro de 2026 (o mês "atual" dos testes).
const HOJE = new Date('2026-11-08T15:00:00Z');
const mesDe = (d: Date) => d.toISOString().slice(0, 7);
const taxa = (ts: { status: string }[]) =>
  ts.filter((t) => t.status === 'concluida').length / ts.length;

function porMes(historico = gerarHistorico(HOJE)) {
  const meses = new Map<string, typeof historico>();
  for (const t of historico) {
    const mes = mesDe(t.prazo);
    meses.set(mes, [...(meses.get(mes) ?? []), t]);
  }
  return meses;
}

describe('gerarHistorico (dados do seed para o resumo mensal)', () => {
  it('espalha as tarefas por vários meses, antes e depois do mês atual', () => {
    const meses = [...porMes().keys()];
    expect(meses.length).toBeGreaterThanOrEqual(8);
    expect(meses.some((m) => m < '2026-11')).toBe(true);
    expect(meses.some((m) => m > '2026-11')).toBe(true);
  });

  it('deixa o mês atual para as tarefas do dia a dia da árvore, sem duplicá-lo', () => {
    expect(porMes().has('2026-11')).toBe(false);
  });

  it('cada mês tem entre 4 e 8 tarefas: o gráfico fica cheio sem a lista virar um mar de itens', () => {
    for (const [mes, ts] of porMes()) {
      expect(ts.length, mes).toBeGreaterThanOrEqual(4);
      expect(ts.length, mes).toBeLessThanOrEqual(8);
    }
  });

  it('meses futuros não têm tarefas concluídas e os passados têm a maioria concluída', () => {
    const passadas = [...porMes()].filter(([mes]) => mes < '2026-11').flatMap(([, ts]) => ts);
    const futuras = [...porMes()].filter(([mes]) => mes > '2026-11').flatMap(([, ts]) => ts);
    expect(futuras.some((t) => t.status === 'concluida')).toBe(false);
    expect(taxa(passadas)).toBeGreaterThan(0.5);
  });

  it('a taxa de conclusão varia de mês para mês, para as barras terem alturas diferentes', () => {
    const passados = [...porMes()].filter(([mes]) => mes < '2026-11');
    const taxas = new Set(passados.map(([, ts]) => Math.round(taxa(ts) * 100)));
    expect(taxas.size).toBeGreaterThanOrEqual(4);
  });

  it('usa as três prioridades e os três status', () => {
    const historico = gerarHistorico(HOJE);
    expect(new Set(historico.map((t) => t.prioridade))).toEqual(
      new Set(['alta', 'media', 'baixa']),
    );
    expect(new Set(historico.map((t) => t.status))).toEqual(
      new Set(['pendente', 'em_andamento', 'concluida']),
    );
  });

  it('cobre 7 meses passados e o seguinte a hoje, sempre em relação à data do seed, inclusive na virada do ano', () => {
    const meses = (hoje: string) => [...porMes(gerarHistorico(new Date(hoje))).keys()].sort();
    expect(meses('2026-11-08T15:00:00Z')).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-12',
    ]);
    expect(meses('2027-01-31T23:30:00Z')).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-02',
    ]);
  });

  it('é determinístico: mesma data, mesmos dados', () => {
    expect(gerarHistorico(HOJE)).toEqual(gerarHistorico(new Date(HOJE)));
  });

  it('os títulos não se repetem e todo grupo citado existe na árvore do seed', () => {
    const historico = gerarHistorico(HOJE);
    const titulos = historico.map((t) => t.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
    const grupos = caminhosDosGrupos(arvore);
    for (const t of historico) expect(grupos.has(t.grupo), t.grupo).toBe(true);
  });

  it('alimenta o resumo mensal da API com uma coluna por mês, cada uma com valores próprios', async () => {
    const usuario = new Types.ObjectId();
    await Task.insertMany(
      gerarHistorico(HOJE).map(({ grupo: _grupo, ...t }) => ({ ...t, usuario })),
    );

    const { meses } = await monthly({}, usuario.toString());
    expect(meses).toHaveLength(8);
    expect(meses.every((m) => m.total >= 4)).toBe(true);
    expect(new Set(meses.map((m) => m.taxaPonderada)).size).toBeGreaterThanOrEqual(5);
  });
});

describe('caminhosDosGrupos', () => {
  it('lista os grupos e subgrupos como "Pai/Filho"', () => {
    const caminhos = caminhosDosGrupos([
      { nome: 'A', subgrupos: [{ nome: 'B', subgrupos: [{ nome: 'C' }] }] },
      { nome: 'D' },
    ]);
    expect(caminhos).toEqual(new Set(['A', 'A/B', 'A/B/C', 'D']));
  });
});
