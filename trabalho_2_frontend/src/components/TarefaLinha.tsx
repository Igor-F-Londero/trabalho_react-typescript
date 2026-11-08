import { useDraggable } from '@dnd-kit/core';
import { idDnd, type Arrasto } from '../lib/arrasto';
import { atrasada } from '../lib/arvore';
import { ROTULO_PRIORIDADE, ROTULO_STATUS, type Tarefa } from '../lib/types';
import ConfirmButton from './ConfirmButton';
import BotaoIcone from './BotaoIcone';
import Icone from './Icone';

interface Props {
  tarefa: Tarefa;
  onEditar: () => void;
  onAtualizar: (dados: Partial<Tarefa>) => void;
  onExcluir: () => void;
}

export default function TarefaLinha({ tarefa: t, onEditar, onAtualizar, onExcluir }: Props) {
  const arrasto: Arrasto = { tipo: 'tarefa', id: t._id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: idDnd(arrasto), data: arrasto });
  const late = atrasada(t);

  return (
    <li ref={setNodeRef} className={`tarefa ${t.status}${isDragging ? ' arrastando' : ''}`}>
      <button
        type="button"
        className="alca"
        aria-label={`Arrastar tarefa ${t.titulo}`}
        title="Arraste para dentro de um grupo"
        {...attributes}
        {...listeners}
      >
        <Icone nome="alca" />
      </button>
      <input
        type="checkbox"
        aria-label={`Concluir ${t.titulo}`}
        checked={t.status === 'concluida'}
        onChange={(e) => onAtualizar({ status: e.target.checked ? 'concluida' : 'pendente' })}
      />
      <span className="texto">
        <span className="titulo">{t.titulo}</span>
        {t.descricao && <span className="descricao">{t.descricao}</span>}
      </span>
      <span className="tags">
        <span className={`tag ${t.prioridade}`}>{ROTULO_PRIORIDADE[t.prioridade]}</span>
        {t.status === 'em_andamento' && <span className="tag">{ROTULO_STATUS[t.status]}</span>}
        {t.prazo && (
          <span className={`tag${late ? ' atrasada' : ''}`}>
            {late ? 'Atrasada · ' : 'Prazo '}
            {new Date(t.prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </span>
        )}
      </span>
      <span className="acoes">
        <BotaoIcone icone="lapis" rotulo={`Editar ${t.titulo}`} className="link" onClick={onEditar} />
        <ConfirmButton onConfirmar={onExcluir} rotulo={`Excluir ${t.titulo}`} />
      </span>
    </li>
  );
}
