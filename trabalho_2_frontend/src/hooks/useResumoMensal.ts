import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const CHAVE_RESUMO = ['resumo-mensal'] as const;

/** Ao mudar tarefas a chave é invalidada: a próxima visita à página de resumo busca os números de novo. */
export const useResumoMensal = () => useQuery({ queryKey: CHAVE_RESUMO, queryFn: api.resumoMensal });
