import { describe, expect, it } from 'vitest';
import {
  FILTRO_VAZIO,
  achatarArvore,
  atrasada,
  construirArvore,
  estaDentro,
  filtrarArvore,
  ocultarIds,
  resumo,
} from './arvore';
import type { Arvore, Tarefa } from './types';

const t = (id: string, extra: Partial<Tarefa> = {}): Tarefa => ({
  _id: id,
  titulo: id,
  status: 'pendente',
  prioridade: 'media',
  grupo: null,
  ...extra,
});

const arvore: Arvore = {
  grupos: [
    {
      _id: 'fac',
      nome: 'Faculdade',
      pai: null,
      tarefas: [t('prova', { titulo: 'Estudar Álgebra', prioridade: 'alta' })],
      subgrupos: [
        {
          _id: 'mat1',
          nome: 'Matéria 1',
          pai: 'fac',
          tarefas: [t('lista', { status: 'concluida', prazo: '2020-01-01' })],
          subgrupos: [],
        },
      ],
    },
    { _id: 'vazio', nome: 'Vazio', pai: null, tarefas: [], subgrupos: [] },
  ],
  tarefasSemGrupo: [t('solta', { prazo: '2020-01-01' })],
};

describe('arvore', () => {
  it('achata e reconstrói sem perder nada', () => {
    const refeita = construirArvore(achatarArvore(arvore));
    expect(refeita.grupos.map((g) => g._id)).toEqual(['fac', 'vazio']);
    expect(refeita.grupos[0].tarefas.map((x) => x._id)).toEqual(['prova']);
    expect(refeita.grupos[0].subgrupos[0].tarefas[0].grupo).toBe('mat1');
    expect(refeita.tarefasSemGrupo.map((x) => x._id)).toEqual(['solta']);
  });

  it('detecta descendentes (evita ciclos ao mover grupo)', () => {
    expect(estaDentro(arvore.grupos, 'fac', 'mat1')).toBe(true);
    expect(estaDentro(arvore.grupos, 'fac', 'fac')).toBe(true);
    expect(estaDentro(arvore.grupos, 'mat1', 'fac')).toBe(false);
  });

  it('considera atrasada só tarefa não concluída com prazo vencido', () => {
    expect(atrasada(t('a', { prazo: '2020-01-01' }), '2025-01-01')).toBe(true);
    expect(atrasada(t('b', { prazo: '2020-01-01', status: 'concluida' }), '2025-01-01')).toBe(false);
    expect(atrasada(t('c'), '2025-01-01')).toBe(false);
  });

  it('calcula o resumo', () => {
    expect(resumo(arvore)).toEqual({ total: 3, concluidas: 1, atrasadas: 1 });
  });

  it('busca ignora acentos e poda grupos sem resultado', () => {
    const r = filtrarArvore(arvore, { ...FILTRO_VAZIO, busca: 'algebra' });
    expect(r.grupos.map((g) => g._id)).toEqual(['fac']);
    expect(r.grupos[0].subgrupos).toEqual([]);
    expect(r.tarefasSemGrupo).toEqual([]);
  });

  it('sem filtro mantém grupos vazios', () => {
    expect(filtrarArvore(arvore, FILTRO_VAZIO).grupos).toHaveLength(2);
  });

  it('ordena por prioridade', () => {
    const a: Arvore = {
      grupos: [],
      tarefasSemGrupo: [t('x', { prioridade: 'baixa' }), t('y', { prioridade: 'alta' })],
    };
    const r = filtrarArvore(a, { ...FILTRO_VAZIO, ordenacao: 'prioridade' });
    expect(r.tarefasSemGrupo.map((x) => x._id)).toEqual(['y', 'x']);
  });

  describe('ocultarIds (exclusão com desfazer)', () => {
    it('devolve a mesma árvore quando não há nada a ocultar', () => {
      expect(ocultarIds(arvore, new Set())).toBe(arvore);
    });

    it('oculta tarefas, dentro de grupos e soltas', () => {
      const r = ocultarIds(arvore, new Set(['prova', 'solta']));
      expect(r.grupos[0].tarefas).toEqual([]);
      expect(r.grupos[0].subgrupos[0].tarefas.map((x) => x._id)).toEqual(['lista']);
      expect(r.tarefasSemGrupo).toEqual([]);
    });

    it('oculta um grupo junto com toda a subárvore', () => {
      const r = ocultarIds(arvore, new Set(['fac']));
      expect(r.grupos.map((g) => g._id)).toEqual(['vazio']);
    });

    it('oculta um subgrupo sem mexer no pai', () => {
      const r = ocultarIds(arvore, new Set(['mat1']));
      expect(r.grupos[0].subgrupos).toEqual([]);
      expect(r.grupos[0].tarefas.map((x) => x._id)).toEqual(['prova']);
    });

    it('não altera a árvore original', () => {
      ocultarIds(arvore, new Set(['fac', 'solta']));
      expect(arvore.grupos).toHaveLength(2);
      expect(arvore.tarefasSemGrupo).toHaveLength(1);
    });
  });
});
