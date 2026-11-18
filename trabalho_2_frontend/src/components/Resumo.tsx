import type { Arvore } from '../lib/types';
import { resumo } from '../lib/arvore';
import { CARTAO } from './estilos';

export default function Resumo({ arvore }: { arvore: Arvore }) {
  const { total, concluidas, atrasadas } = resumo(arvore);
  if (!total) return null;
  const pct = Math.round((concluidas / total) * 100);

  return (
    <div className={`${CARTAO} mb-4 flex flex-wrap items-center gap-x-8 gap-y-3`}>
      <Estatistica valor={total} rotulo={total === 1 ? 'tarefa' : 'tarefas'} />
      <Estatistica valor={concluidas} rotulo={concluidas === 1 ? 'concluída' : 'concluídas'} />
      <Estatistica valor={atrasadas} rotulo={atrasadas === 1 ? 'atrasada' : 'atrasadas'} alerta={atrasadas > 0} />
      <div className="flex flex-[1_1_220px] flex-col gap-1.5 text-sm text-suave">
        <span>Progresso · {pct}%</span>
        <div
          className="h-2 overflow-hidden rounded-full bg-cartao-sub"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso"
        >
          <div className="h-full rounded-full bg-primaria transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function Estatistica({ valor, rotulo, alerta = false }: { valor: number; rotulo: string; alerta?: boolean }) {
  return (
    <div className={`text-sm ${alerta ? 'text-perigo' : 'text-suave'}`}>
      <b className={`text-2xl font-semibold tabular-nums ${alerta ? 'text-perigo' : 'text-texto'}`}>{valor}</b> <span>{rotulo}</span>
    </div>
  );
}
