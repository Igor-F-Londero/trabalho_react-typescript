import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AvancoGeral from './AvancoGeral';

describe('AvancoGeral', () => {
  it('mostra o percentual no centro e descreve o valor para leitores de tela', () => {
    render(<AvancoGeral valor={35} legenda="por importância" descricao="Avanço geral de 35%" />);
    expect(screen.getByRole('img', { name: 'Avanço geral de 35%' })).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeVisible();
    expect(screen.getByText('por importância')).toBeVisible();
  });

  it('desenha o arco do avanço (e o trilho por trás) com a biblioteca de gráficos', () => {
    const { container } = render(<AvancoGeral valor={35} legenda="x" descricao="y" />);
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-radial-bar-background-sector, .recharts-radial-bar-sector').length).toBeGreaterThan(0);
  });

  it('aceita 0% e 100% sem quebrar', () => {
    render(<AvancoGeral valor={0} legenda="x" descricao="zero" />);
    render(<AvancoGeral valor={100} legenda="x" descricao="cheio" />);
    expect(screen.getByText('0%')).toBeVisible();
    expect(screen.getByText('100%')).toBeVisible();
  });
});
