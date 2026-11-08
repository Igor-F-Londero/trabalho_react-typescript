import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { cancelarPendentes } from './lib/exclusoes';

const usuario = { id: '1', nome: 'Maria', email: 'maria@email.com' };
const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

/** Simula o servidor: `logado` representa a existência do cookie de sessão. */
const resumoMensal = {
  pesos: { alta: 3, media: 2, baixa: 1 },
  meses: [
    {
      mes: '2026-10',
      total: 1,
      concluidas: 0,
      taxa: 0,
      taxaPonderada: 0,
      prioridades: { alta: { total: 0, concluidas: 0 }, media: { total: 1, concluidas: 0 }, baixa: { total: 0, concluidas: 0 } },
    },
  ],
  geral: { total: 1, concluidas: 0, taxa: 0, taxaPonderada: 0, mediaTarefasPorMes: 1, mediaConcluidasPorMes: 0, semPrazo: 0 },
};

const arvoreVazia = { grupos: [], tarefasSemGrupo: [] };

function simularServidor(logado: boolean, arvore: unknown = arvoreVazia) {
  const estado = { logado };
  const chamadas: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const rota = `${init?.method ?? 'GET'} ${new URL(url).pathname}`;
      chamadas.push(rota);
      if (rota === 'POST /auth/login') {
        estado.logado = true;
        return json(200, { token: 'jwt' });
      }
      if (rota === 'POST /auth/logout') {
        estado.logado = false;
        return new Response(null, { status: 204 });
      }
      if (!estado.logado) return json(401, { erro: 'Token não informado' });
      if (rota === 'GET /auth/me') return json(200, usuario);
      if (rota === 'GET /grupos/arvore') return json(200, arvore);
      if (rota.startsWith('DELETE ')) return new Response(null, { status: 204 });
      if (rota.startsWith('PUT ')) return json(200, {});
      if (rota === 'POST /grupos') return json(201, { _id: 'gnovo', nome: 'Novo', pai: null });
      if (rota === 'POST /tarefas') return json(201, { _id: 'tnova', titulo: 'Nova', status: 'pendente', prioridade: 'media', grupo: null });
      if (rota === 'GET /tarefas/resumo-mensal') return json(200, resumoMensal);
      return json(404, { erro: 'Rota não encontrada' });
    }),
  );
  return chamadas;
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
  localStorage.clear();
});
afterEach(() => {
  cancelarPendentes();
  vi.unstubAllGlobals();
});

describe('App (sessão por cookie)', () => {
  it('sem sessão, mostra o login', async () => {
    simularServidor(false);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('com sessão ativa, mostra o dashboard sem passar pelo login', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument();
    expect(screen.getByText(/arraste uma tarefa para dentro de um grupo/i)).toBeInTheDocument();
  });

  it('recolher um grupo esconde o conteúdo e abrir mostra de novo', async () => {
    simularServidor(true, {
      grupos: [
        {
          _id: 'g1',
          nome: 'Faculdade',
          pai: null,
          subgrupos: [],
          tarefas: [{ _id: 't1', titulo: 'Estudar hooks', status: 'pendente', prioridade: 'media', grupo: 'g1' }],
        },
      ],
      tarefasSemGrupo: [],
    });
    render(<App />);
    expect(await screen.findByText('Estudar hooks')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Recolher Faculdade' }));
    expect(screen.queryByText('Estudar hooks')).not.toBeInTheDocument();
    const abrir = screen.getByRole('button', { name: 'Abrir Faculdade' });
    expect(abrir).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(abrir);
    expect(screen.getByText('Estudar hooks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher Faculdade' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('entrar leva ao dashboard', async () => {
    const chamadas = simularServidor(false);
    render(<App />);
    await userEvent.type(await screen.findByLabelText('E-mail'), 'maria@email.com');
    await userEvent.type(screen.getByLabelText('Senha'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Minhas tarefas' })).toBeInTheDocument();
    expect(chamadas).toContain('POST /auth/login');
  });

  it('sair encerra a sessão no servidor e volta ao login', async () => {
    const chamadas = simularServidor(true);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(chamadas).toContain('POST /auth/logout');
  });

  it('volta ao login quando a sessão expira (401 ao salvar algo)', async () => {
    const chamadas = simularServidor(true);
    render(<App />);
    await screen.findByRole('heading', { name: 'Minhas tarefas' });
    await userEvent.click(screen.getByRole('button', { name: 'Novo grupo' }));
    const campo = await screen.findByRole('textbox');
    await userEvent.type(campo, 'Faculdade');
    // O cookie expira no servidor: a criação do grupo passa a receber 401.
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { erro: 'Token inválido ou expirado' })));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(chamadas).not.toContain('POST /grupos');
  });
});

const tarefa = (id: string, titulo: string, grupo: string | null) => ({
  _id: id, titulo, status: 'pendente', prioridade: 'media', grupo,
});
const arvoreComGrupo = {
  grupos: [{ _id: 'g1', nome: 'Faculdade', pai: null, subgrupos: [], tarefas: [tarefa('t1', 'Estudar hooks', 'g1')] }],
  tarefasSemGrupo: [],
};

describe('Dashboard (clareza, estados e fluxo)', () => {
  it('cumprimenta o usuário pelo nome', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    expect(await screen.findByText(/Maria/)).toBeInTheDocument();
  });

  it('sem nenhum dado, orienta o primeiro passo e esconde os filtros', async () => {
    simularServidor(true);
    render(<App />);
    expect(await screen.findByText('Você ainda não tem grupos')).toBeInTheDocument();
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Criar primeiro grupo' }));
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('lembra os grupos recolhidos depois de recarregar a página', async () => {
    simularServidor(true, arvoreComGrupo);
    const primeira = render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Recolher Faculdade' }));
    primeira.unmount();

    render(<App />);
    expect(await screen.findByRole('button', { name: 'Abrir Faculdade' })).toBeInTheDocument();
    expect(screen.queryByText('Estudar hooks')).not.toBeInTheDocument();
  });
});

const arvoreComGrupoVazio = {
  grupos: [{ _id: 'g9', nome: 'Casa', pai: null, subgrupos: [], tarefas: [] }],
  tarefasSemGrupo: [],
};

/** Clica na lixeira e na confirmação de um item (ex.: "Excluir Estudar hooks"). */
async function excluir(rotulo: string) {
  await userEvent.click(await screen.findByRole('button', { name: rotulo }));
  await userEvent.click(screen.getByRole('button', { name: `Confirmar: ${rotulo}` }));
}

/** O botão não tem texto visível: o ícone mostra a ação e o nome acessível (também a dica do mouse) a descreve. */
function esperarSoIcone(nome: string, icone: string) {
  const botao = screen.getByRole('button', { name: nome });
  expect(botao.textContent, `"${nome}" não deveria ter texto visível`).toBe('');
  expect(botao.querySelector(`svg.icone-${icone}`), `"${nome}" deveria usar o ícone ${icone}`).toBeInTheDocument();
  expect(botao).toHaveAttribute('title', nome);
}

describe('Botões só com ícone', () => {
  it('as ações do topo mostram o ícone que representa cada uma', async () => {
    localStorage.setItem('tema', 'escuro');
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await screen.findByText(/Maria/);
    esperarSoIcone('Novo grupo', 'pasta');
    esperarSoIcone('Nova tarefa sem grupo', 'tarefaMais');
    esperarSoIcone('Sair da conta', 'sair');
    esperarSoIcone('Mudar para o tema claro', 'sol');
  });

  it('as ações do grupo e da tarefa também', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await screen.findByText('Estudar hooks');
    esperarSoIcone('Nova tarefa em Faculdade', 'tarefaMais');
    esperarSoIcone('Novo subgrupo em Faculdade', 'subpasta');
    esperarSoIcone('Renomear Faculdade', 'lapis');
    esperarSoIcone('Excluir Faculdade', 'lixeira');
    esperarSoIcone('Editar Estudar hooks', 'lapis');
    esperarSoIcone('Excluir Estudar hooks', 'lixeira');
  });

  it('o primeiro passo, quando não há grupos, também é só ícone', async () => {
    simularServidor(true);
    render(<App />);
    await screen.findByText('Você ainda não tem grupos');
    esperarSoIcone('Criar primeiro grupo', 'pasta');
  });

  it('o formulário de tarefa salva com o disquete e cancela com o X', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nova tarefa sem grupo' }));
    esperarSoIcone('Salvar tarefa', 'salvar');
    esperarSoIcone('Cancelar', 'x');
  });

  it('o formulário de nome também', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }));
    esperarSoIcone('Salvar', 'salvar');
    esperarSoIcone('Cancelar', 'x');
  });

  it('a confirmação da exclusão usa o visto e o X', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Estudar hooks' }));
    esperarSoIcone('Confirmar: Excluir Estudar hooks', 'ok');
    esperarSoIcone('Cancelar exclusão', 'x');
  });

  it('o aviso de exclusão oferece "Desfazer" com a seta de voltar', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await excluir('Excluir Estudar hooks');
    esperarSoIcone('Desfazer', 'desfazer');
  });

  it('se a lista não carrega, "Tentar de novo" é a seta circular', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const { pathname } = new URL(url);
        if (pathname === '/auth/me') return json(200, usuario);
        return json(500, { erro: 'Erro interno' });
      }),
    );
    render(<App />);
    await screen.findByRole('alert');
    esperarSoIcone('Tentar de novo', 'recarregar');
  });

  it('a tela de login mantém o texto: ali o botão é o próprio formulário', async () => {
    simularServidor(false);
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Entrar' })).toHaveTextContent('Entrar');
    expect(screen.getByRole('button', { name: 'Criar uma conta' })).toHaveTextContent('Criar uma conta');
  });
});

describe('Desfazer exclusão', () => {
  it('excluir tarefa a esconde na hora e Desfazer a traz de volta sem chamar o servidor', async () => {
    const chamadas = simularServidor(true, arvoreComGrupo);
    render(<App />);
    await excluir('Excluir Estudar hooks');

    expect(screen.queryByLabelText('Concluir Estudar hooks')).not.toBeInTheDocument();
    expect(screen.getByText(/Estudar hooks.*excluída/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByLabelText('Concluir Estudar hooks')).toBeInTheDocument();
    expect(chamadas.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  it('excluir grupo vazio também pode ser desfeito', async () => {
    const chamadas = simularServidor(true, arvoreComGrupoVazio);
    render(<App />);
    await excluir('Excluir Casa');
    expect(screen.queryByRole('button', { name: 'Recolher Casa' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByRole('button', { name: 'Recolher Casa' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  it('grupo com conteúdo pede confirmação extra e o "excluir tudo" também pode ser desfeito', async () => {
    const chamadas = simularServidor(true, arvoreComGrupo);
    render(<App />);
    await excluir('Excluir Faculdade');
    expect(await screen.findByText('Tem conteúdo. Excluir tudo?')).toBeInTheDocument();
    expect(chamadas.some((c) => c.startsWith('DELETE'))).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Faculdade e todo o conteúdo' }));
    expect(screen.queryByRole('button', { name: 'Recolher Faculdade' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByRole('button', { name: 'Recolher Faculdade' })).toBeInTheDocument();
    expect(screen.getByLabelText('Concluir Estudar hooks')).toBeInTheDocument();
    expect(chamadas.some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  it('sair confirma as exclusões pendentes antes de encerrar a sessão', async () => {
    const chamadas = simularServidor(true, arvoreComGrupo);
    render(<App />);
    await excluir('Excluir Estudar hooks');
    await userEvent.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();

    const apagou = chamadas.indexOf('DELETE /tarefas/t1');
    expect(apagou).toBeGreaterThan(-1);
    expect(apagou).toBeLessThan(chamadas.indexOf('POST /auth/logout'));
  });
});

describe('Resumo mensal no dashboard', () => {
  it('aparece recolhido e abre mostrando os meses', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    const botao = await screen.findByRole('button', { name: /Resumo mensal/ });
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(botao);
    expect(await screen.findByRole('listitem', { name: /outubro de 2026/ })).toBeInTheDocument();
  });

  it('não aparece enquanto o usuário não tem nenhum dado', async () => {
    simularServidor(true);
    render(<App />);
    await screen.findByText('Você ainda não tem grupos');
    expect(screen.queryByRole('button', { name: /Resumo mensal/ })).not.toBeInTheDocument();
  });

  it('se atualiza depois que uma tarefa muda', async () => {
    const chamadas = simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: /Resumo mensal/ }));
    await screen.findByRole('listitem', { name: /outubro de 2026/ });
    const buscas = () => chamadas.filter((c) => c === 'GET /tarefas/resumo-mensal').length;
    expect(buscas()).toBe(1);

    await userEvent.click(screen.getByLabelText('Concluir Estudar hooks'));
    await vi.waitFor(() => expect(buscas()).toBe(2));
  });
});

describe('Feedback ao usuário', () => {
  it('criar um grupo mostra um aviso de sucesso', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }));
    await userEvent.type(await screen.findByRole('textbox'), 'Casa{Enter}');
    expect(await screen.findByText('Grupo criado')).toBeInTheDocument();
  });

  it('criar uma tarefa mostra um aviso de sucesso', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nova tarefa sem grupo' }));
    await userEvent.type(await screen.findByLabelText('Título'), 'Pagar conta');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar tarefa' }));
    expect(await screen.findByText('Tarefa criada')).toBeInTheDocument();
  });

  it('editar uma tarefa mostra um aviso de sucesso', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Estudar hooks' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar tarefa' }));
    expect(await screen.findByText('Tarefa atualizada')).toBeInTheDocument();
  });

  it('renomear um grupo mostra um aviso de sucesso', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Renomear Faculdade' }));
    await userEvent.type(screen.getByLabelText('Novo nome'), '{Enter}');
    expect(await screen.findByText('Grupo atualizado')).toBeInTheDocument();
  });

  it('marcar a tarefa como concluída não gera aviso (seria ruído a cada clique)', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    await userEvent.click(await screen.findByLabelText('Concluir Estudar hooks'));
    expect(screen.queryByText('Tarefa atualizada')).not.toBeInTheDocument();
  });

  it('explica de forma amigável quando a API está fora do ar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('NetworkError when attempting to fetch resource.'))));
    render(<App />);
    await userEvent.type(await screen.findByLabelText('E-mail'), 'maria@email.com');
    await userEvent.type(screen.getByLabelText('Senha'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível conectar ao servidor');
    expect(alerta).not.toHaveTextContent('NetworkError');
  });

  it('mostra "Entrando…" e bloqueia o botão enquanto o login está em andamento', async () => {
    let liberar = () => {};
    const espera = new Promise<void>((r) => (liberar = r));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (`${init?.method ?? 'GET'} ${new URL(url).pathname}` === 'POST /auth/login') {
          await espera;
          return json(200, { token: 'x' });
        }
        return json(401, { erro: 'Token não informado' });
      }),
    );
    render(<App />);
    await userEvent.type(await screen.findByLabelText('E-mail'), 'maria@email.com');
    await userEvent.type(screen.getByLabelText('Senha'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('button', { name: 'Entrando…' })).toBeDisabled();
    liberar();
  });
});

const arvoreComSolta = {
  grupos: [],
  tarefasSemGrupo: [{ _id: 'ts', titulo: 'Ligar para a vovó', descricao: 'À noite', status: 'pendente', prioridade: 'media', grupo: null }],
};

describe('Tarefas sem grupo (comportamento preservado na refatoração)', () => {
  it('mostra título e descrição na área "Sem grupo"', async () => {
    simularServidor(true, arvoreComSolta);
    render(<App />);
    expect(await screen.findByText('Ligar para a vovó')).toBeInTheDocument();
    expect(screen.getByText('À noite')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sem grupo' })).toBeInTheDocument();
  });

  it('edita: abre o formulário preenchido e salva', async () => {
    const chamadas = simularServidor(true, arvoreComSolta);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Ligar para a vovó' }));
    expect(screen.getByLabelText('Título')).toHaveValue('Ligar para a vovó');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar tarefa' }));
    expect(await screen.findByText('Tarefa atualizada')).toBeInTheDocument();
    expect(chamadas).toContain('PUT /tarefas/ts');
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
  });

  it('cancelar a edição volta para a linha da tarefa', async () => {
    simularServidor(true, arvoreComSolta);
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Editar Ligar para a vovó' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Concluir Ligar para a vovó')).toBeInTheDocument();
  });

  it('conclui a tarefa', async () => {
    const chamadas = simularServidor(true, arvoreComSolta);
    render(<App />);
    await userEvent.click(await screen.findByLabelText('Concluir Ligar para a vovó'));
    await vi.waitFor(() => expect(chamadas).toContain('PUT /tarefas/ts'));
  });

  it('exclui com a opção de desfazer', async () => {
    const chamadas = simularServidor(true, arvoreComSolta);
    render(<App />);
    await excluir('Excluir Ligar para a vovó');
    expect(screen.queryByLabelText('Concluir Ligar para a vovó')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
    expect(await screen.findByLabelText('Concluir Ligar para a vovó')).toBeInTheDocument();
    expect(chamadas.some((c) => c.startsWith('DELETE'))).toBe(false);
  });
});

describe('Alternador de tema', () => {
  it('aparece na tela de login', async () => {
    simularServidor(false);
    render(<App />);
    expect(await screen.findByRole('button', { name: /Mudar para o tema/ })).toBeInTheDocument();
  });

  it('aparece no dashboard', async () => {
    simularServidor(true, arvoreComGrupo);
    render(<App />);
    expect(await screen.findByRole('button', { name: /Mudar para o tema/ })).toBeInTheDocument();
  });
});
