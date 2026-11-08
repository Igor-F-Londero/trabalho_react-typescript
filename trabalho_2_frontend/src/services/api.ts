import type { Arvore, Grupo, ResumoMensal, Tarefa, Usuario } from '../lib/types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const mensagemDeErro = (err: unknown) =>
  err instanceof Error ? err.message : 'Erro inesperado';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // A sessão vive em um cookie HttpOnly: o navegador o envia sozinho com `credentials: 'include'`.
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // API fora do ar, sem rede ou CORS bloqueado: o navegador só dá uma mensagem técnica ("NetworkError...").
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e se a API está rodando.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalhes = Array.isArray(data.detalhes)
      ? ': ' + data.detalhes.map((d: { mensagem: string }) => d.mensagem).join('; ')
      : '';
    throw new ApiError(res.status, (data.erro ?? 'Erro na requisição') + detalhes);
  }
  return data as T;
}

export const api = {
  login: (email: string, senha: string) =>
    request<{ token: string }>('POST', '/auth/login', { email, senha }),
  logout: () => request<void>('POST', '/auth/logout'),
  /** Usuário da sessão atual, ou `null` se não estiver logado. */
  me: async () => {
    try {
      return await request<Usuario>('GET', '/auth/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
  register: (nome: string, email: string, senha: string) =>
    request('POST', '/auth/register', { nome, email, senha }),

  arvore: () => request<Arvore>('GET', '/grupos/arvore'),
  criarGrupo: (nome: string, pai: string | null) =>
    request<Grupo>('POST', '/grupos', { nome, pai }),
  atualizarGrupo: (id: string, dados: Partial<Pick<Grupo, 'nome' | 'pai'>>) =>
    request<Grupo>('PUT', `/grupos/${id}`, dados),
  excluirGrupo: (id: string, cascata: boolean) =>
    request<void>('DELETE', `/grupos/${id}${cascata ? '?cascata=true' : ''}`),

  criarTarefa: (dados: Partial<Tarefa>) => request<Tarefa>('POST', '/tarefas', dados),
  atualizarTarefa: (id: string, dados: Partial<Tarefa>) =>
    request<Tarefa>('PUT', `/tarefas/${id}`, dados),
  resumoMensal: () => request<ResumoMensal>('GET', '/tarefas/resumo-mensal'),
  excluirTarefa: (id: string) => request<void>('DELETE', `/tarefas/${id}`),
};
