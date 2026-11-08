import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('api (autenticação por cookie)', () => {
  it('envia o cookie da sessão em todas as requisições', async () => {
    fetchMock.mockResolvedValue(json(200, { grupos: [], tarefasSemGrupo: [] }));
    await api.arvore();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('não envia Authorization nem lê token do localStorage', async () => {
    localStorage.setItem('token', 'antigo');
    fetchMock.mockResolvedValue(json(200, { grupos: [], tarefasSemGrupo: [] }));
    await api.arvore();
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('login envia credenciais e não guarda token no navegador', async () => {
    fetchMock.mockResolvedValue(json(200, { token: 'jwt' }));
    await api.login('a@a.com', '123456');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('me devolve o usuário logado', async () => {
    const usuario = { id: '1', nome: 'Maria', email: 'maria@email.com' };
    fetchMock.mockResolvedValue(json(200, usuario));
    expect(await api.me()).toEqual(usuario);
  });

  it('me devolve null quando não há sessão (401)', async () => {
    fetchMock.mockResolvedValue(json(401, { erro: 'Token não informado' }));
    expect(await api.me()).toBeNull();
  });

  it('me propaga erros que não são 401', async () => {
    fetchMock.mockResolvedValue(json(500, { erro: 'Falha' }));
    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
  });

  it('logout chama POST /auth/logout com credenciais', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await api.logout();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/logout$/);
    expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
  });

  it('resumoMensal busca o resumo com credenciais', async () => {
    fetchMock.mockResolvedValue(json(200, { meses: [] }));
    await api.resumoMensal();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/tarefas\/resumo-mensal$/);
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' });
  });

  it('troca a mensagem crua do navegador por uma explicação quando a API está fora do ar', async () => {
    fetchMock.mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.'));
    const erro = await api.arvore().catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.message).toBe('Não foi possível conectar ao servidor. Verifique sua conexão e se a API está rodando.');
    expect(erro.message).not.toMatch(/NetworkError/i);
  });

  it('me também falha com a mensagem amigável (não confunde com sessão expirada)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.me()).rejects.toThrow(/Não foi possível conectar/);
  });
});
