import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { resumoDeTeste } from '../test-utils/resumoMensal';
import TabelaMensal from './TabelaMensal';

const hoje = new Date(2026, 9, 15);
const montar = () => render(<TabelaMensal resumo={resumoDeTeste} hoje={hoje} />);

describe('TabelaMensal', () => {
  it('usa títulos de coluna em linguagem simples', () => {
    montar();
    for (const nome of ['Mês', 'Tarefas', 'Concluídas', '% feito', '% por importância']) {
      expect(screen.getByRole('columnheader', { name: nome })).toBeInTheDocument();
    }
    expect(screen.queryByText(/ponderada/i)).not.toBeInTheDocument();
  });

  it('mostra uma linha por mês com as duas taxas', () => {
    montar();
    const linha = screen.getByText('outubro de 2026').closest('tr')!;
    expect(linha).toHaveTextContent('9');
    expect(linha).toHaveTextContent('6');
    expect(linha).toHaveTextContent('66,7%');
    expect(linha).toHaveTextContent('52,4%');
  });

  it('detalha em cada mês as concluídas por prioridade', () => {
    montar();
    expect(screen.getByText('outubro de 2026').closest('tr')).toHaveTextContent(/Alta 2\/3.*Média 3\/4.*Baixa 1\/2/);
  });

  it('marca o mês atual e os meses que ainda não começaram', () => {
    montar();
    expect(screen.getByText('outubro de 2026').closest('tr')).toHaveTextContent('mês atual');
    expect(screen.getByText('novembro de 2026').closest('tr')).toHaveTextContent('ainda não começou');
  });

  it('termina com a linha do total geral', () => {
    montar();
    const geral = screen.getByText('Geral').closest('tr')!;
    expect(geral).toHaveTextContent('19');
    expect(geral).toHaveTextContent('31,6%');
    expect(geral).toHaveTextContent('35%');
  });
});
