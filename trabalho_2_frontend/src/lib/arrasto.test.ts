import { describe, expect, it } from 'vitest';
import { decidirMovimento, idDnd } from './arrasto';
import type { Arvore, Tarefa } from './types';

const t = (id: string): Tarefa => ({ _id: id, titulo: id, status: 'pendente', prioridade: 'media', grupo: null });

// Faculdade (prova) › Matéria 1 (lista) | Vazio | tarefa solta
const arvore: Arvore = {
  grupos: [
    {
      _id: 'fac',
      nome: 'Faculdade',
      pai: null,
      tarefas: [t('prova')],
      subgrupos: [{ _id: 'mat1', nome: 'Matéria 1', pai: 'fac', tarefas: [t('lista')], subgrupos: [] }],
    },
    { _id: 'vazio', nome: 'Vazio', pai: null, tarefas: [], subgrupos: [] },
  ],
  tarefasSemGrupo: [t('solta')],
};

const mover = (tipo: 'tarefa' | 'grupo', id: string, destino: string | null) =>
  decidirMovimento(arvore, { tipo, id }, destino);

describe('decidirMovimento (arrastar e soltar)', () => {
  describe('tarefas', () => {
    it('move para outro grupo', () => {
      expect(mover('tarefa', 'prova', 'vazio')).toEqual({ tipo: 'tarefa', id: 'prova', dados: { grupo: 'vazio' } });
    });

    it('solta em "Sem grupo" (destino nulo) para tirar do grupo', () => {
      expect(mover('tarefa', 'prova', null)).toEqual({ tipo: 'tarefa', id: 'prova', dados: { grupo: null } });
    });

    it('move uma tarefa solta para dentro de um grupo', () => {
      expect(mover('tarefa', 'solta', 'mat1')).toEqual({ tipo: 'tarefa', id: 'solta', dados: { grupo: 'mat1' } });
    });

    it('não faz nada ao soltar no mesmo lugar', () => {
      expect(mover('tarefa', 'prova', 'fac')).toBeNull();
      expect(mover('tarefa', 'solta', null)).toBeNull();
    });

    it('ignora tarefa que não existe mais', () => {
      expect(mover('tarefa', 'fantasma', 'fac')).toBeNull();
    });
  });

  describe('grupos', () => {
    it('move para dentro de outro grupo', () => {
      expect(mover('grupo', 'mat1', 'vazio')).toEqual({ tipo: 'grupo', id: 'mat1', dados: { pai: 'vazio' } });
    });

    it('vira grupo raiz ao soltar em "Sem grupo"', () => {
      expect(mover('grupo', 'mat1', null)).toEqual({ tipo: 'grupo', id: 'mat1', dados: { pai: null } });
    });

    it('não faz nada ao soltar no pai atual', () => {
      expect(mover('grupo', 'mat1', 'fac')).toBeNull();
      expect(mover('grupo', 'fac', null)).toBeNull();
    });

    it('bloqueia mover um grupo para dentro de si mesmo ou de um descendente (ciclo)', () => {
      expect(mover('grupo', 'fac', 'fac')).toBeNull();
      expect(mover('grupo', 'fac', 'mat1')).toBeNull();
    });

    it('ignora grupo que não existe mais', () => {
      expect(mover('grupo', 'fantasma', 'fac')).toBeNull();
    });
  });

  it('gera ids do dnd-kit que não colidem entre tarefa e grupo com o mesmo id', () => {
    expect(idDnd({ tipo: 'tarefa', id: 'x' })).not.toBe(idDnd({ tipo: 'grupo', id: 'x' }));
  });
});
