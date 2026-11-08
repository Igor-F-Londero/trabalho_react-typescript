import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { api, mensagemDeErro } from '../services/api';
import { achatarArvore, acharGrupo, construirArvore, ocultarIds, type Plana } from '../lib/arvore';
import { assinarOcultos, idsOcultos } from '../lib/exclusoes';
import type { Arvore, Grupo, Tarefa } from '../lib/types';
import { CHAVE_ARVORE, invalidarTudo } from './consultas';
import { useExclusaoComDesfazer } from './useExclusaoComDesfazer';
import { useToast } from './useToast';

/** Árvore sem os itens que o usuário excluiu e ainda podem ser desfeitos. */
export function useArvore() {
  const ocultos = useSyncExternalStore(assinarOcultos, idsOcultos);
  const select = useCallback((a: Arvore) => ocultarIds(a, ocultos), [ocultos]);
  return useQuery({ queryKey: CHAVE_ARVORE, queryFn: api.arvore, select });
}

/** Lançado ao tentar excluir um grupo com conteúdo sem pedir exclusão em cascata. */
export class GrupoNaoVazio extends Error {
  constructor() {
    super('Grupo não está vazio');
  }
}

/** Mutation com atualização otimista: aplica `editar` no cache e desfaz se falhar. */
function useMutacaoOtimista<V>(
  fn: (v: V) => Promise<unknown>,
  editar: (plana: Plana, v: V) => Plana,
  /** Aviso de sucesso opcional; omitido nas ações frequentes (ex.: marcar como concluída) para não virar ruído. */
  sucesso?: string,
) {
  const qc = useQueryClient();
  const avisar = useToast();
  return useMutation({
    mutationFn: fn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: CHAVE_ARVORE });
      const antes = qc.getQueryData<Arvore>(CHAVE_ARVORE);
      if (antes) qc.setQueryData<Arvore>(CHAVE_ARVORE, construirArvore(editar(achatarArvore(antes), v)));
      return { antes };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.antes) qc.setQueryData(CHAVE_ARVORE, ctx.antes);
      avisar(mensagemDeErro(err));
    },
    onSuccess: () => sucesso && avisar(sucesso, 'ok'),
    onSettled: () => invalidarTudo(qc),
  });
}

export function useAcoes() {
  const qc = useQueryClient();
  const avisar = useToast();
  const invalidar = () => invalidarTudo(qc);

  const excluirComDesfazer = useExclusaoComDesfazer();
  const arvoreEmCache = () => qc.getQueryData<Arvore>(CHAVE_ARVORE);
  /** Aviso de sucesso e atualização da tela depois de criar ou editar. */
  const sucesso = (texto: string) => {
    avisar(texto, 'ok');
    return invalidar();
  };
  const aoErrar = (e: unknown) => avisar(mensagemDeErro(e));

  const atualizarTarefa = useMutacaoOtimista<{ id: string; dados: Partial<Tarefa> }>(
    ({ id, dados }) => api.atualizarTarefa(id, dados),
    (p, { id, dados }) => ({
      ...p,
      tarefas: p.tarefas.map((t) => (t._id === id ? { ...t, ...dados } : t)),
    }),
  );

  const atualizarGrupo = useMutacaoOtimista<{ id: string; dados: Partial<Pick<Grupo, 'nome' | 'pai'>> }>(
    ({ id, dados }) => api.atualizarGrupo(id, dados),
    (p, { id, dados }) => ({
      ...p,
      grupos: p.grupos.map((g) => (g._id === id ? { ...g, ...dados } : g)),
    }),
    'Grupo atualizado',
  );

  return {
    atualizarTarefa: (id: string, dados: Partial<Tarefa>) => atualizarTarefa.mutate({ id, dados }),
    excluirTarefa: (id: string) => {
      const arvore = arvoreEmCache();
      const titulo = (arvore && achatarArvore(arvore).tarefas.find((t) => t._id === id)?.titulo) || '';
      excluirComDesfazer([id], `Tarefa “${titulo}” excluída`, () => api.excluirTarefa(id));
    },
    atualizarGrupo: (id: string, dados: Partial<Pick<Grupo, 'nome' | 'pai'>>) =>
      atualizarGrupo.mutate({ id, dados }),
    criarGrupo: useMutation({
      mutationFn: ({ nome, pai }: { nome: string; pai: string | null }) => api.criarGrupo(nome, pai),
      onError: aoErrar,
      onSuccess: () => sucesso('Grupo criado'),
    }).mutate,
    criarTarefa: useMutation({
      mutationFn: (dados: Partial<Tarefa>) => api.criarTarefa(dados),
      onSuccess: () => sucesso('Tarefa criada'),
    }).mutateAsync,
    editarTarefa: useMutation({
      mutationFn: ({ id, dados }: { id: string; dados: Partial<Tarefa> }) =>
        api.atualizarTarefa(id, dados),
      onSuccess: () => sucesso('Tarefa atualizada'),
    }).mutateAsync,
    /** Lança `GrupoNaoVazio` se o grupo tiver conteúdo e `cascata` for falso. */
    excluirGrupo: async (id: string, cascata: boolean) => {
      const arvore = arvoreEmCache();
      const grupo = arvore && acharGrupo(arvore.grupos, id);
      if (!cascata && grupo && (grupo.subgrupos.length || grupo.tarefas.length)) throw new GrupoNaoVazio();
      const nome = grupo?.nome ?? '';
      const texto = cascata ? `Grupo “${nome}” e seu conteúdo excluídos` : `Grupo “${nome}” excluído`;
      excluirComDesfazer([id], texto, () => api.excluirGrupo(id, cascata));
    },
  };
}
