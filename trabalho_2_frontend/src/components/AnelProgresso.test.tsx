import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnelProgresso, { CIRCUNFERENCIA } from './AnelProgresso';

const preenchimento = (container: HTMLElement) =>
  1 - Number(container.querySelector('.anel-valor')!.getAttribute('stroke-dashoffset')) / CIRCUNFERENCIA;

describe('AnelProgresso', () => {
  it('mostra o percentual no centro e descreve o valor para leitores de tela', () => {
    render(<AnelProgresso valor={35} legenda="por importância" descricao="Avanço geral de 35%" />);
    expect(screen.getByRole('img', { name: 'Avanço geral de 35%' })).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeVisible();
    expect(screen.getByText('por importância')).toBeVisible();
  });

  it.each([
    [0, 0],
    [25, 0.25],
    [50, 0.5],
    [100, 1],
  ])('preenche %i%% do anel', (valor, esperado) => {
    const { container } = render(<AnelProgresso valor={valor} legenda="x" descricao="y" />);
    expect(preenchimento(container)).toBeCloseTo(esperado, 3);
  });

  it('limita o preenchimento entre 0% e 100%', () => {
    const acima = render(<AnelProgresso valor={150} legenda="x" descricao="y" />);
    expect(preenchimento(acima.container)).toBeCloseTo(1, 3);
    const abaixo = render(<AnelProgresso valor={-20} legenda="x" descricao="y" />);
    expect(preenchimento(abaixo.container)).toBeCloseTo(0, 3);
  });
});
