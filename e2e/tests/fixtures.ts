import { expect, test as base, type APIRequestContext } from '@playwright/test';
import { FUSO, URL_API } from './constantes';

export { expect };

export interface Conta {
  nome: string;
  email: string;
  senha: string;
}

export interface Grupo {
  _id: string;
  nome: string;
  pai: string | null;
}

/** Grupo da árvore: com os subgrupos (recursivo) e as tarefas que estão nele. */
export interface GrupoNo extends Grupo {
  subgrupos: GrupoNo[];
  tarefas: Tarefa[];
}

export interface Tarefa {
  _id: string;
  titulo: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta';
  prazo?: string;
  grupo: string | null;
}

let contador = 0;

/** Uma conta que nunca existiu antes: e-mails únicos deixam os testes independentes entre si. */
export function novaConta(): Conta {
  const sufixo = `${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { nome: `Maria ${sufixo}`, email: `maria.${sufixo}@exemplo.com`, senha: 'senha-segura-123' };
}

/** Data ISO no mês atual (meio-dia em UTC, longe de qualquer virada de dia). O "mês atual" é o do fuso do navegador do teste. */
export function prazoNoMesAtual(dia = 15) {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const ano = Number(partes.find((p) => p.type === 'year')!.value);
  const mes = Number(partes.find((p) => p.type === 'month')!.value);
  return new Date(Date.UTC(ano, mes - 1, dia, 12)).toISOString();
}

/** "novembro de 2026", como o app escreve o mês de um prazo. */
export const nomeDoMes = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * Atalho para falar com a API real sem passar pela tela: serve para preparar os dados de um teste
 * e para conferir, no servidor, o que a interface gravou. O cookie de sessão fica no mesmo "navegador" da página.
 */
export class Api {
  constructor(private readonly requisicoes: APIRequestContext) {}

  private async corpo<T>(resposta: Awaited<ReturnType<APIRequestContext['get']>>, esperado: number): Promise<T> {
    expect(resposta.status(), await resposta.text()).toBe(esperado);
    return (await resposta.json()) as T;
  }

  async cadastrar(conta: Conta) {
    await this.corpo(await this.requisicoes.post(`${URL_API}/auth/register`, { data: conta }), 201);
  }

  async cadastrarELogar(conta: Conta) {
    await this.cadastrar(conta);
    await this.corpo(
      await this.requisicoes.post(`${URL_API}/auth/login`, { data: { email: conta.email, senha: conta.senha } }),
      200,
    );
  }

  async criarGrupo(nome: string, pai: string | null = null) {
    return this.corpo<Grupo>(await this.requisicoes.post(`${URL_API}/grupos`, { data: { nome, pai } }), 201);
  }

  async criarTarefa(dados: Partial<Omit<Tarefa, '_id'>> & { titulo: string }) {
    return this.corpo<Tarefa>(await this.requisicoes.post(`${URL_API}/tarefas`, { data: dados }), 201);
  }

  /** `null` quando a API responde 404 (a tarefa não existe, ou não é desta conta). */
  async tarefa(id: string) {
    const resposta = await this.requisicoes.get(`${URL_API}/tarefas/${id}`);
    if (resposta.status() === 404) return null;
    return this.corpo<Tarefa>(resposta, 200);
  }

  async arvore() {
    return this.corpo<{ grupos: GrupoNo[]; tarefasSemGrupo: Tarefa[] }>(
      await this.requisicoes.get(`${URL_API}/grupos/arvore`),
      200,
    );
  }

  async tarefas() {
    return this.corpo<Tarefa[]>(await this.requisicoes.get(`${URL_API}/tarefas`), 200);
  }

  async grupo(id: string) {
    const resposta = await this.requisicoes.get(`${URL_API}/grupos/${id}`);
    if (resposta.status() === 404) return null;
    return this.corpo<Grupo>(resposta, 200);
  }
}

interface Fixtures {
  /** Dados de uma conta nova, ainda não cadastrada. */
  conta: Conta;
  /** Uma conta já cadastrada e logada no navegador do teste: a `page` já abre dentro do app. */
  sessao: { conta: Conta; api: Api };
}

export const test = base.extend<Fixtures>({
  conta: async ({}, use) => {
    await use(novaConta());
  },
  sessao: async ({ conta, context }, use) => {
    const api = new Api(context.request);
    await api.cadastrarELogar(conta);
    await use({ conta, api });
  },
});
