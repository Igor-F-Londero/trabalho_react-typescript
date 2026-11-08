import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FILTRO_VAZIO } from '../lib/arvore';
import Filtros from './Filtros';

describe('Filtros', () => {
  it('não mostra "limpar" sem filtro ativo', () => {
    render(<Filtros filtro={FILTRO_VAZIO} onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('emite o filtro de status e permite limpar', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Filtros filtro={FILTRO_VAZIO} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'pendente');
    expect(onChange).toHaveBeenCalledWith({ ...FILTRO_VAZIO, status: 'pendente' });

    rerender(<Filtros filtro={{ ...FILTRO_VAZIO, status: 'pendente' }} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(onChange).toHaveBeenLastCalledWith(FILTRO_VAZIO);
  });
});
