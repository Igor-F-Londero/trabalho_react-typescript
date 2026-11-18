import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { useAnimarGraficos } from '../../hooks/useAnimarGraficos';
import { dadosPrioridades, descreverPrioridades, type FatiaPrioridade } from '../../lib/graficos';
import type { MesResumo } from '../../lib/types';
import { COR_PRIORIDADE } from './cores';
import DicaGrafico from './DicaGrafico';

const TAMANHO = 190;

/** Rosca com a divisão das tarefas por prioridade e, ao lado, quantas de cada uma já foram concluídas. */
export default function GraficoPrioridades({ meses }: { meses: MesResumo[] }) {
  const animar = useAnimarGraficos();
  const fatias = dadosPrioridades(meses);
  const total = fatias.reduce((soma, f) => soma + f.total, 0);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
      <figure role="img" aria-label={descreverPrioridades(fatias)} className="relative m-0 shrink-0" style={{ width: TAMANHO, height: TAMANHO }}>
        <PieChart width={TAMANHO} height={TAMANHO}>
          <Tooltip wrapperStyle={{ zIndex: 20 }} content={<DicaGrafico titulo={(f: FatiaPrioridade) => `Prioridade ${f.rotulo.toLowerCase()}`} valor={(v) => `${v} ${v === 1 ? 'tarefa' : 'tarefas'}`} />} />
          <Pie
            data={fatias}
            dataKey="total"
            nameKey="rotulo"
            innerRadius="66%"
            outerRadius="100%"
            paddingAngle={fatias.filter((f) => f.total > 0).length > 1 ? 3 : 0}
            cornerRadius={6}
            stroke="none"
            isAnimationActive={animar}
            animationDuration={900}
          >
            {fatias.map((f) => (
              <Cell key={f.prioridade} fill={COR_PRIORIDADE[f.prioridade]} />
            ))}
          </Pie>
        </PieChart>
        <figcaption aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-3xl leading-none font-bold tabular-nums">{total}</strong>
          <span className="mt-1 text-[0.7rem] text-suave">tarefas</span>
        </figcaption>
      </figure>

      <ul aria-label="Legenda das prioridades" className="flex min-w-40 flex-col gap-2.5 text-sm">
        {fatias.map((f) => (
          <li key={f.prioridade} className="flex items-center gap-2">
            <i className="inline-block size-3 rounded-[4px]" style={{ background: COR_PRIORIDADE[f.prioridade] }} />
            <span className="font-medium">{f.rotulo}</span>
            <span className="ml-auto pl-4 text-suave tabular-nums">
              <b className="font-semibold text-texto">{f.concluidas}/{f.total}</b> concluídas
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
