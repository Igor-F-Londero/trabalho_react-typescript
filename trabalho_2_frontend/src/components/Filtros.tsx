import BotaoIcone from './BotaoIcone';
import { FILTRO_VAZIO, filtroAtivo, type Filtro, type Ordenacao } from '../lib/arvore';
import { ROTULO_PRIORIDADE, ROTULO_STATUS, type Prioridade, type Status } from '../lib/types';

interface Props {
  filtro: Filtro;
  onChange: (f: Filtro) => void;
}

export default function Filtros({ filtro, onChange }: Props) {
  const set = <K extends keyof Filtro>(k: K, v: Filtro[K]) => onChange({ ...filtro, [k]: v });

  return (
    <div className="filtros" role="search">
      <input
        type="search"
        placeholder="Buscar tarefas…"
        aria-label="Buscar tarefas"
        value={filtro.busca}
        onChange={(e) => set('busca', e.target.value)}
      />
      <select aria-label="Status" value={filtro.status} onChange={(e) => set('status', e.target.value as Status | '')}>
        <option value="">Todos os status</option>
        {Object.entries(ROTULO_STATUS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
      </select>
      <select aria-label="Prioridade" value={filtro.prioridade} onChange={(e) => set('prioridade', e.target.value as Prioridade | '')}>
        <option value="">Toda prioridade</option>
        {Object.entries(ROTULO_PRIORIDADE).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
      </select>
      <select aria-label="Ordenar por" value={filtro.ordenacao} onChange={(e) => set('ordenacao', e.target.value as Ordenacao)}>
        <option value="padrao">Ordem padrão</option>
        <option value="prazo">Por prazo</option>
        <option value="prioridade">Por prioridade</option>
        <option value="titulo">Por título</option>
      </select>
      <label className="check">
        <input type="checkbox" checked={filtro.atrasadas} onChange={(e) => set('atrasadas', e.target.checked)} />
        Só atrasadas
      </label>
      {(filtroAtivo(filtro) || filtro.ordenacao !== 'padrao') && (
        <BotaoIcone icone="x" rotulo="Limpar filtros" className="link" onClick={() => onChange(FILTRO_VAZIO)} />
      )}
    </div>
  );
}
