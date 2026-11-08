import type { Arvore } from '../lib/types';
import { resumo } from '../lib/arvore';

export default function Resumo({ arvore }: { arvore: Arvore }) {
  const { total, concluidas, atrasadas } = resumo(arvore);
  if (!total) return null;
  const pct = Math.round((concluidas / total) * 100);

  return (
    <div className="resumo card">
      <div className="stat">
        <b>{total}</b> <span>{total === 1 ? 'tarefa' : 'tarefas'}</span>
      </div>
      <div className="stat">
        <b>{concluidas}</b> <span>{concluidas === 1 ? 'concluída' : 'concluídas'}</span>
      </div>
      <div className={`stat${atrasadas ? ' erro' : ''}`}>
        <b>{atrasadas}</b> <span>{atrasadas === 1 ? 'atrasada' : 'atrasadas'}</span>
      </div>
      <div className="progresso">
        <span>Progresso · {pct}%</span>
        <div className="barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
