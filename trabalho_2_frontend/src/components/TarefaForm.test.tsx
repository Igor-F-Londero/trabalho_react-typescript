import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TarefaForm from './TarefaForm';

describe('TarefaForm', () => {
  it('todos os campos têm rótulo visível', () => {
    render(<TarefaForm onSalvar={async () => {}} onCancelar={() => {}} />);
    for (const rotulo of ['Título', 'Descrição', 'Status', 'Prioridade', 'Prazo']) {
      expect(screen.getByLabelText(rotulo)).toBeVisible();
    }
  });

  it('Esc cancela a edição', async () => {
    const onCancelar = vi.fn();
    render(<TarefaForm onSalvar={async () => {}} onCancelar={onCancelar} />);
    await userEvent.type(screen.getByLabelText('Título'), 'abc{Escape}');
    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it('envia os dados preenchidos', async () => {
    const onSalvar = vi.fn(async () => {});
    render(<TarefaForm onSalvar={onSalvar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Título'), 'Estudar');
    await userEvent.selectOptions(screen.getByLabelText('Prioridade'), 'alta');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar tarefa' }));
    expect(onSalvar).toHaveBeenCalledWith(expect.objectContaining({ titulo: 'Estudar', prioridade: 'alta' }));
  });
});
