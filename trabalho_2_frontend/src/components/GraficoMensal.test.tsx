import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resumoDeTeste } from '../test-utils/resumoMensal';
import GraficoMensal from './GraficoMensal';

const hoje = new Date(2026, 9, 15); // 15/10/2026: outubro é o mês atual e novembro ainda não começou

const montar = () => render(<GraficoMensal meses={resumoDeTeste.meses} hoje={hoje} />);
const colunas = () => within(screen.getByRole('list', { name: 'Conclusão por mês' })).getAllByRole('listitem');

describe('GraficoMensal', () => {
  it('tem uma coluna por mês, descrita por extenso para leitores de tela', () => {
    montar();
    const [outubro, novembro] = colunas();
    expect(outubro).toHaveAccessibleName(/outubro de 2026.*66,7% feito.*52,4% por importância.*6 de 9 tarefas/);
    expect(outubro).toHaveAccessibleName(/Alta 2\/3.*Média 3\/4.*Baixa 1\/2/);
    expect(novembro).toHaveAccessibleName(/novembro de 2026.*0% feito/);
  });

  it('desenha duas barras por mês, com a altura proporcional ao percentual', () => {
    const { container } = montar();
    const [outubro] = container.querySelectorAll('.grafico-mes');
    expect(outubro.querySelector('.barra-feito')).toHaveStyle({ height: '66.7%' });
    expect(outubro.querySelector('.barra-importancia')).toHaveStyle({ height: '52.4%' });
  });

  it('escreve o valor em cima de cada barra', () => {
    const { container } = montar();
    const [outubro] = container.querySelectorAll('.grafico-mes');
    expect(outubro.querySelector('.barra-feito')).toHaveTextContent('66,7%');
    expect(outubro.querySelector('.barra-importancia')).toHaveTextContent('52,4%');
  });

  it('abrevia o mês no rótulo e marca o mês atual e o que ainda não começou', () => {
    const { container } = montar();
    const [outubro, novembro] = container.querySelectorAll('.grafico-mes');
    expect(outubro).toHaveTextContent('out/26');
    expect(outubro).toHaveTextContent('atual');
    expect(novembro).toHaveTextContent('nov/26');
    expect(novembro).not.toHaveTextContent('atual');
    expect(novembro).toHaveAccessibleName(/ainda não começou/);
  });

  it('mostra a escala de 0% a 100% e a legenda das duas barras', () => {
    montar();
    for (const marca of ['0%', '50%', '100%']) expect(screen.getAllByText(marca).length).toBeGreaterThan(0);
    expect(screen.getByText('% feito')).toBeVisible();
    expect(screen.getByText('% por importância')).toBeVisible();
  });

  it('abre com o mês atual em destaque e mostra seu detalhe', () => {
    const { container } = montar();
    expect(container.querySelector('[data-ativo="true"]')).toHaveTextContent('out/26');
    expect(container.querySelector('.grafico-detalhe')).toHaveTextContent('outubro de 2026');
    expect(container.querySelector('.grafico-detalhe')).toHaveTextContent('6 de 9 tarefas');
  });

  it('passar o mouse ou focar outro mês troca o detalhe', async () => {
    const { container } = montar();
    const [, novembro] = colunas();
    await userEvent.hover(novembro);
    expect(container.querySelector('.grafico-detalhe')).toHaveTextContent('novembro de 2026');
    await userEvent.tab();
    expect(container.querySelector('[data-ativo="true"]')).toBeTruthy();
  });

  it('as colunas são alcançáveis pelo teclado', async () => {
    montar();
    await userEvent.tab();
    expect(colunas()[0]).toHaveFocus();
    await userEvent.tab();
    expect(colunas()[1]).toHaveFocus();
  });

  // O jsdom não calcula layout: simulamos uma tela de 300 px com o mês em destaque (80 px) a 500 px do início.
  describe('em telas estreitas, onde as colunas não cabem', () => {
    afterEach(() => vi.restoreAllMocks());
    const simularLayout = (larguraDaLista: number) => {
      vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (this: HTMLElement) {
        return this.dataset.ativo === 'true' ? 500 : 0;
      });
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
      vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(larguraDaLista);
    };

    it('abre já rolado até o mês em destaque, para ele não ficar escondido', () => {
      simularLayout(300);
      montar();
      expect(screen.getByRole('list', { name: 'Conclusão por mês' }).scrollLeft).toBe(390); // 500 - (300 - 80) / 2
    });

    it('não rola quando todas as colunas cabem', () => {
      simularLayout(2000);
      montar();
      expect(screen.getByRole('list', { name: 'Conclusão por mês' }).scrollLeft).toBe(0);
    });
  });
});
