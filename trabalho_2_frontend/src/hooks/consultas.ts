import type { QueryClient } from '@tanstack/react-query';
import { CHAVE_RESUMO } from './useResumoMensal';

export const CHAVE_ARVORE = ['arvore'] as const;

/** Árvore e resumo mensal dependem das mesmas tarefas: mudou uma, atualiza as duas. */
export const invalidarTudo = async (qc: QueryClient) => {
  await Promise.all([
    qc.invalidateQueries({ queryKey: CHAVE_ARVORE }),
    qc.invalidateQueries({ queryKey: CHAVE_RESUMO }),
  ]);
};
