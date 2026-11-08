import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmButton from './ConfirmButton';

describe('ConfirmButton', () => {
  it('só confirma no segundo clique', async () => {
    const onConfirmar = vi.fn();
    render(<ConfirmButton onConfirmar={onConfirmar} rotulo="Excluir tarefa" />);

    await userEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    expect(onConfirmar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar: Excluir tarefa' }));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it('cancela com "não"', async () => {
    const onConfirmar = vi.fn();
    render(<ConfirmButton onConfirmar={onConfirmar} rotulo="Excluir tarefa" />);
    await userEvent.click(screen.getByRole('button', { name: 'Excluir tarefa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar exclusão' }));
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Excluir tarefa' })).toBeInTheDocument();
  });
});
