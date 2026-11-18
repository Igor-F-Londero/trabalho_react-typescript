import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resumoDeTeste } from '../../test-utils/resumoMensal';
import GraficoEvolucao from './GraficoEvolucao';

describe('GraficoEvolucao', () => {
  it('é uma imagem descrita por extenso, com tarefas e concluídas de cada mês', () => {
    render(<GraficoEvolucao meses={resumoDeTeste.meses} />);
    const grafico = screen.getByRole('img', { name: /^Evolução das tarefas por mês/ });
    expect(grafico).toHaveAccessibleName(/out\/26: 9 tarefas, 6 concluídas/);
    expect(grafico).toHaveAccessibleName(/nov\/26: 10 tarefas, 0 concluídas/);
  });

  it('desenha o gráfico de áreas com a biblioteca e o rótulo de cada mês', () => {
    const { container } = render(<GraficoEvolucao meses={resumoDeTeste.meses} />);
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
    expect(container).toHaveTextContent('out/26');
    expect(container).toHaveTextContent('nov/26');
  });

  it('explica as duas áreas na legenda', () => {
    render(<GraficoEvolucao meses={resumoDeTeste.meses} />);
    expect(screen.getByText('Tarefas do mês')).toBeVisible();
    expect(screen.getByText('Concluídas')).toBeVisible();
  });
});
