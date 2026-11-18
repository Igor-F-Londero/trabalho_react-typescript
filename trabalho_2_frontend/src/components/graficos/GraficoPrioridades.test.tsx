import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resumoDeTeste } from '../../test-utils/resumoMensal';
import GraficoPrioridades from './GraficoPrioridades';

describe('GraficoPrioridades', () => {
  it('é uma imagem que diz quantas tarefas de cada prioridade foram concluídas', () => {
    render(<GraficoPrioridades meses={resumoDeTeste.meses} />);
    expect(screen.getByRole('img', { name: /^Tarefas por prioridade/ })).toHaveAccessibleName(
      /Alta: 2 de 4 concluídas.*Média: 3 de 9 concluídas.*Baixa: 1 de 6 concluídas/,
    );
  });

  it('desenha a rosca com a biblioteca e mostra o total de tarefas no centro', () => {
    const { container } = render(<GraficoPrioridades meses={resumoDeTeste.meses} />);
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeVisible();
    expect(screen.getByText('tarefas')).toBeVisible();
  });

  it('lista cada prioridade com suas concluídas e o total', () => {
    render(<GraficoPrioridades meses={resumoDeTeste.meses} />);
    const lista = screen.getByRole('list', { name: 'Legenda das prioridades' });
    const itens = within(lista).getAllByRole('listitem');
    expect(itens).toHaveLength(3);
    expect(itens[0]).toHaveTextContent('Alta');
    expect(itens[0]).toHaveTextContent('2/4');
    expect(itens[1]).toHaveTextContent('Média');
    expect(itens[1]).toHaveTextContent('3/9');
    expect(itens[2]).toHaveTextContent('Baixa');
    expect(itens[2]).toHaveTextContent('1/6');
  });
});
