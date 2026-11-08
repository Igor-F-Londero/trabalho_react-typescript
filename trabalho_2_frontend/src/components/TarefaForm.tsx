import { useId, useState } from 'react';
import BotaoIcone from './BotaoIcone';
import type { Prioridade, Status, Tarefa } from '../lib/types';

type Dados = Pick<Tarefa, 'titulo' | 'descricao' | 'status' | 'prioridade' | 'prazo'>;

interface Props {
  inicial?: Tarefa;
  onSalvar: (dados: Dados) => Promise<void>;
  onCancelar: () => void;
}

export default function TarefaForm({ inicial, onSalvar, onCancelar }: Props) {
  const id = useId();
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [status, setStatus] = useState<Status>(inicial?.status ?? 'pendente');
  const [prioridade, setPrioridade] = useState<Prioridade>(inicial?.prioridade ?? 'media');
  const [prazo, setPrazo] = useState(inicial?.prazo?.slice(0, 10) ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await onSalvar({ titulo, descricao, status, prioridade, prazo: prazo || undefined });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="tarefa-form" onSubmit={enviar} onKeyDown={(e) => e.key === 'Escape' && onCancelar()}>
      <div className="campo">
        <label htmlFor={`${id}-titulo`}>Título</label>
        <input id={`${id}-titulo`} value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-descricao`}>Descrição</label>
        <input id={`${id}-descricao`} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="campos">
        <div className="campo">
          <label htmlFor={`${id}-status`}>Status</label>
          <select id={`${id}-status`} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-prioridade`}>Prioridade</label>
          <select id={`${id}-prioridade`} value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-prazo`}>Prazo</label>
          <input id={`${id}-prazo`} type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="linha">
        <BotaoIcone icone="salvar" rotulo="Salvar tarefa" type="submit" disabled={salvando} />
        <BotaoIcone icone="x" rotulo="Cancelar" className="link" onClick={onCancelar} />
      </div>
    </form>
  );
}
