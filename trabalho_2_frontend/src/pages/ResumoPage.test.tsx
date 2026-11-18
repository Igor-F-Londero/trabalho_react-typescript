import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resumoDeTeste } from '../test-utils/resumoMensal';
import ResumoPage from './ResumoPage';

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  // Só a data é simulada (timers reais): 15/10/2026, então outubro é o mês atual e novembro está no futuro.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  fetchMock = vi.fn(async () => json(200, resumoDeTeste));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ResumoPage />
    </QueryClientProvider>,
  );
}

describe('ResumoPage', () => {
  it('é uma página própria: já abre buscando o resumo, sem nada para expandir', async () => {
    montar();
    expect(screen.getByRole('heading', { level: 1, name: 'Resumo mensal' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    await screen.findByRole('img', { name: /Conclusão por mês/ });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/tarefas\/resumo-mensal$/);
    expect(screen.queryByRole('button', { name: /Resumo mensal/ })).not.toBeInTheDocument();
  });

  it('mostra o avanço geral por importância em um gráfico radial', async () => {
    montar();
    const radial = await screen.findByRole('img', { name: /35%.*importância/ });
    expect(radial).toHaveAccessibleName(/31,6%/);
  });

  it('resume os números em cartões', async () => {
    montar();
    const cartoes = await screen.findByLabelText('Resumo em números');
    expect(cartoes).toHaveTextContent('6/19');
    expect(cartoes).toHaveTextContent('tarefas concluídas');
    expect(cartoes).toHaveTextContent('9,5');
    expect(cartoes).toHaveTextContent('tarefas por mês');
    expect(cartoes).toHaveTextContent('3');
    expect(cartoes).toHaveTextContent('concluídas por mês');
  });

  it('traz os três gráficos: conclusão por mês, evolução e prioridades', async () => {
    montar();
    expect(await screen.findByRole('img', { name: /^Conclusão por mês/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^Evolução das tarefas por mês/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^Tarefas por prioridade/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Conclusão por mês' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Evolução' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Por prioridade' })).toBeInTheDocument();
  });

  it('esconde a explicação e a tabela até o usuário pedir', async () => {
    montar();
    await screen.findByRole('img', { name: /^Conclusão por mês/ });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/alta vale 3, média 2 e baixa 1/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabela detalhada' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Como é calculado' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('os botões de explicação e de tabela mostram só o ícone (i e tabela), sem texto', async () => {
    montar();
    const como = await screen.findByRole('button', { name: 'Como é calculado' });
    const tabela = screen.getByRole('button', { name: 'Tabela detalhada' });
    expect(como.textContent).toBe('');
    expect(tabela.textContent).toBe('');
    expect(como.querySelector('svg.icone-info')).toBeInTheDocument();
    expect(tabela.querySelector('svg.icone-tabela')).toBeInTheDocument();
    expect(como).toHaveAttribute('title', 'Como é calculado');
    expect(tabela).toHaveAttribute('title', 'Tabela detalhada');
  });

  it('"Como é calculado" explica os dois percentuais e os pesos', async () => {
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Como é calculado' }));
    expect(screen.getByText(/alta vale 3, média 2 e baixa 1/)).toBeInTheDocument();
    expect(screen.getByText(/tarefas concluídas ÷ tarefas do mês/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Como é calculado' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('"Tabela detalhada" mostra e esconde a tabela com os números exatos', async () => {
    montar();
    const botao = await screen.findByRole('button', { name: 'Tabela detalhada' });
    await userEvent.click(botao);
    expect(screen.getByRole('table')).toHaveTextContent('outubro de 2026');
    expect(screen.getByText('Geral').closest('tr')).toHaveTextContent('35%');
    await userEvent.click(botao);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('avisa quantas tarefas ficaram de fora por não terem prazo', async () => {
    montar();
    expect(await screen.findByText(/5 tarefas sem prazo não entram no resumo/)).toBeInTheDocument();
  });

  it('sem nenhuma tarefa com prazo, explica o motivo em vez de mostrar gráficos vazios', async () => {
    fetchMock.mockResolvedValue(
      json(200, { ...resumoDeTeste, meses: [], geral: { ...resumoDeTeste.geral, total: 0, semPrazo: 0 } }),
    );
    montar();
    expect(await screen.findByText(/Nenhuma tarefa com prazo ainda/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa quando não consegue carregar', async () => {
    fetchMock.mockResolvedValue(json(500, { erro: 'Falha' }));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Falha/);
  });
});
