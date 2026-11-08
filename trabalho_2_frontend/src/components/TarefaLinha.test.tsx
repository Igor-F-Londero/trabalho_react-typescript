import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Tarefa } from '../lib/types';
import TarefaLinha from './TarefaLinha';

const tarefa: Tarefa = { _id: '1', titulo: 'Ligar para a vovó', status: 'pendente', prioridade: 'media', grupo: null };

describe('TarefaLinha', () => {
  it('explica na alça que a tarefa pode ser arrastada para um grupo', () => {
    render(
      <DndContext>
        <ul>
          <TarefaLinha tarefa={tarefa} onEditar={() => {}} onAtualizar={() => {}} onExcluir={() => {}} />
        </ul>
      </DndContext>,
    );
    const alca = screen.getByRole('button', { name: 'Arrastar tarefa Ligar para a vovó' });
    expect(alca).toHaveAttribute('title', 'Arraste para dentro de um grupo');
  });

  it('mostra a descrição da tarefa na própria linha', () => {
    render(
      <DndContext>
        <ul>
          <TarefaLinha
            tarefa={{ ...tarefa, descricao: 'Capítulos 1 a 3' }}
            onEditar={() => {}}
            onAtualizar={() => {}}
            onExcluir={() => {}}
          />
        </ul>
      </DndContext>,
    );
    expect(screen.getByText('Capítulos 1 a 3')).toBeVisible();
  });

  const montar = (t: Tarefa) =>
    render(
      <DndContext>
        <ul>
          <TarefaLinha tarefa={t} onEditar={() => {}} onAtualizar={() => {}} onExcluir={() => {}} />
        </ul>
      </DndContext>,
    );

  it('mostra a prioridade por extenso, com maiúscula e acento', () => {
    montar({ ...tarefa, prioridade: 'media' });
    expect(screen.getByText('Média')).toBeInTheDocument();
    expect(screen.queryByText('media')).not.toBeInTheDocument();
  });

  it('deixa claro que a data é o prazo', () => {
    montar({ ...tarefa, prazo: '2099-11-10T00:00:00.000Z' });
    expect(screen.getByText('Prazo 10/11/2099')).toBeInTheDocument();
  });

  it('tarefa atrasada continua dizendo "Atrasada" com a data', () => {
    montar({ ...tarefa, prazo: '2020-01-01T00:00:00.000Z' });
    expect(screen.getByText('Atrasada · 01/01/2020')).toBeInTheDocument();
  });
});
