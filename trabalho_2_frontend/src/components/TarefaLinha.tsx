import { useDraggable } from '@dnd-kit/core';
import { idDnd, type Arrasto } from '../lib/arrasto';
import { atrasada } from '../lib/arvore';
import { ROTULO_PRIORIDADE, ROTULO_STATUS, type Tarefa } from '../lib/types';
import ConfirmButton from './ConfirmButton';
import BotaoIcone from './BotaoIcone';
import { BOTAO_SUTIL } from './estilos';
import Etiqueta from './Etiqueta';
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
    <li
      ref={setNodeRef}
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-borda px-1 py-1.5 last:border-b-0 hover:bg-texto/5 max-sm:gap-x-1.5 max-sm:px-0.5 ${isDragging ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        className={`${BOTAO_SUTIL} cursor-grab touch-none active:cursor-grabbing`}
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
      <span className="flex min-w-0 flex-[1_1_180px] flex-col max-sm:basis-[120px]">
        <span className={t.status === 'concluida' ? 'text-suave line-through' : ''}>{t.titulo}</span>
        {t.descricao && <span className="text-[0.85rem] text-suave [overflow-wrap:anywhere]">{t.descricao}</span>}
      </span>
      <span className="flex flex-wrap items-center gap-1.5 max-sm:order-3 max-sm:ml-[58px] max-sm:basis-full">
        <Etiqueta tom={t.prioridade}>{ROTULO_PRIORIDADE[t.prioridade]}</Etiqueta>
        {t.status === 'em_andamento' && <Etiqueta>{ROTULO_STATUS[t.status]}</Etiqueta>}
        {t.prazo && (
          <Etiqueta tom={late ? 'atrasada' : 'neutro'}>
            {late ? 'Atrasada · ' : 'Prazo '}
            {new Date(t.prazo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </Etiqueta>
        )}
      </span>
      <span className="ml-auto flex items-center gap-0.5">
        <BotaoIcone icone="lapis" rotulo={`Editar ${t.titulo}`} variante="discreto" onClick={onEditar} />
        <ConfirmButton onConfirmar={onExcluir} rotulo={`Excluir ${t.titulo}`} />
      </span>
    </li>
  );
}
