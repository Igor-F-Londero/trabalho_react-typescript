import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const CHAVE_RESUMO = ['resumo-mensal'] as const;

/** Só busca quando `ativo` (bloco aberto); ao mudar tarefas a chave é invalidada e o resumo se atualiza. */
export const useResumoMensal = (ativo: boolean) =>
  useQuery({ queryKey: CHAVE_RESUMO, queryFn: api.resumoMensal, enabled: ativo });
