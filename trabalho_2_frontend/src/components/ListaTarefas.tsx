import { useState } from 'react';
import { useAcoes } from '../hooks/useArvore';
import type { Tarefa } from '../lib/types';
import TarefaForm from './TarefaForm';
import TarefaLinha from './TarefaLinha';

/**
 * Linhas de tarefa (`<li>`) para colocar dentro de um `<ul>`. Cada uma pode virar um formulário de
 * edição; as ações (editar, concluir, excluir) vêm do `useAcoes`, então quem usa só passa as tarefas.
 */
export default function ListaTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  const acoes = useAcoes();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <>
      {tarefas.map((t) =>
        editandoId === t._id ? (
          <li key={t._id}>
            <TarefaForm
              inicial={t}
              onCancelar={() => setEditandoId(null)}
              onSalvar={async (dados) => {
                await acoes.editarTarefa({ id: t._id, dados });
                setEditandoId(null);
              }}
            />
          </li>
        ) : (
          <TarefaLinha
            key={t._id}
            tarefa={t}
            onEditar={() => setEditandoId(t._id)}
            onAtualizar={(dados) => acoes.atualizarTarefa(t._id, dados)}
            onExcluir={() => acoes.excluirTarefa(t._id)}
          />
        ),
      )}
    </>
  );
}
