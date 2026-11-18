import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MesResumo } from '../../../src/lib/types';
import { resumoDeTeste } from '../../helpers/resumoMensal';
import GraficoConclusao from '../../../src/components/graficos/GraficoConclusao';

const hoje = new Date(2026, 9, 15); // 15/10/2026: outubro é o mês atual e novembro ainda não começou
const montar = (meses = resumoDeTeste.meses, quando = hoje) =>
  render(<GraficoConclusao meses={meses} hoje={quando} />);

describe('GraficoConclusao', () => {
  it('é uma imagem descrita por extenso, mês a mês, para leitores de tela', () => {
    montar();
    const grafico = screen.getByRole('img', { name: /^Conclusão por mês/ });
    expect(grafico).toHaveAccessibleName(/outubro de 2026: 66,7% feito e 52,4% por importância.*6 de 9 tarefas/);
    expect(grafico).toHaveAccessibleName(/Alta 2\/3 · Média 3\/4 · Baixa 1\/2/);
    expect(grafico).toHaveAccessibleName(/novembro de 2026: 0% feito.*ainda não começou/);
  });

  it('desenha o gráfico de barras com a biblioteca, com o rótulo curto de cada mês', () => {
    const { container } = montar();
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
    expect(container).toHaveTextContent('out/26');
    expect(container).toHaveTextContent('nov/26');
  });

  it('marca só o mês atual', () => {
    const { container } = montar();
    expect(container.textContent?.match(/atual/g)).toHaveLength(1);
  });

  it('mostra a escala de 0% a 100%', () => {
    const { container } = montar();
    for (const marca of ['0%', '50%', '100%']) expect(container).toHaveTextContent(marca);
  });

  it('explica as duas barras na legenda', () => {
    montar();
    expect(screen.getByText('% feito')).toBeVisible();
    expect(screen.getByText('% por importância')).toBeVisible();
  });

  // O jsdom não calcula layout: simulamos uma tela estreita (300 px) com 6 meses num gráfico de 1200 px.
  describe('em telas estreitas, onde os meses não cabem', () => {
    afterEach(() => vi.restoreAllMocks());
    const seisMeses: MesResumo[] = ['05', '06', '07', '08', '09', '10'].map((mm) => ({
      ...resumoDeTeste.meses[0],
      mes: `2026-${mm}`,
    }));
    const simularLayout = (larguraVisivel: number) => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(larguraVisivel);
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(1200);
    };

    it('abre já rolado até o mês atual, para ele não ficar escondido', () => {
      simularLayout(300);
      montar(seisMeses, new Date(2026, 7, 10)); // agosto: 4º de 6 meses
      // centro do 4º mês = 3,5/6 × 1200 = 700; menos metade da tela (150)
      expect(screen.getByRole('img').scrollLeft).toBe(550);
    });

    it('não passa do fim quando o mês atual é o último', () => {
      simularLayout(300);
      montar(seisMeses, new Date(2026, 9, 10));
      expect(screen.getByRole('img').scrollLeft).toBe(900); // 1200 - 300
    });

    it('não rola quando tudo cabe', () => {
      simularLayout(2000);
      montar(seisMeses, new Date(2026, 7, 10));
      expect(screen.getByRole('img').scrollLeft).toBe(0);
    });
  });
});
