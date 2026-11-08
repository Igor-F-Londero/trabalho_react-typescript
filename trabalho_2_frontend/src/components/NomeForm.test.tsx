import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NomeForm from './NomeForm';

describe('NomeForm', () => {
  it('Enter salva e Esc cancela', async () => {
    const onSalvar = vi.fn();
    const onCancelar = vi.fn();
    render(<NomeForm rotulo="Nome do grupo" onSalvar={onSalvar} onCancelar={onCancelar} />);
    await userEvent.type(screen.getByLabelText('Nome do grupo'), 'Casa{Enter}');
    expect(onSalvar).toHaveBeenCalledWith('Casa');
    await userEvent.type(screen.getByLabelText('Nome do grupo'), '{Escape}');
    expect(onCancelar).toHaveBeenCalledOnce();
  });
});
