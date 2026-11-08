import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, mensagemDeErro } from '../services/api';
import { confirmarPendentes } from '../lib/exclusoes';
import { useToast } from './useToast';

export const CHAVE_SESSAO = ['sessao'] as const;

/** Usuário logado (`null` = sem sessão); `isPending` enquanto o servidor ainda não respondeu. */
export function useSessao() {
  return useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: api.me,
    staleTime: Infinity,
    retry: false,
  });
}

/** Zera a sessão no cliente e descarta os dados em cache para não vazar nada ao próximo login. */
export function encerrarSessaoLocal(client: QueryClient) {
  client.removeQueries({ predicate: (q) => q.queryKey[0] !== CHAVE_SESSAO[0] });
  client.setQueryData(CHAVE_SESSAO, null);
}

/** Encerra a sessão: confirma as exclusões ainda desfazíveis, apaga o cookie no servidor e só então limpa o cliente. */
export function useSair() {
  const client = useQueryClient();
  const avisar = useToast();

  return async () => {
    try {
      // As exclusões pendentes precisam ir ao servidor enquanto a sessão ainda existe.
      await confirmarPendentes();
      await api.logout();
      encerrarSessaoLocal(client);
    } catch (err) {
      avisar(mensagemDeErro(err));
    }
  };
}
