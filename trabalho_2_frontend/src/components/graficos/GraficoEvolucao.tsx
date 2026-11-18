import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useAnimarGraficos } from '../../hooks/useAnimarGraficos';
import { dadosEvolucao, descreverEvolucao, type PontoEvolucao } from '../../lib/graficos';
import { formatarMes } from '../../lib/resumoMensal';
import type { MesResumo } from '../../lib/types';
import { COR } from './cores';
import DicaGrafico from './DicaGrafico';
import Legenda from './Legenda';

/** Áreas sobrepostas: quantas tarefas cada mês tinha e quantas delas foram concluídas. */
export default function GraficoEvolucao({ meses }: { meses: MesResumo[] }) {
  const animar = useAnimarGraficos();
  const id = useId().replace(/:/g, '');
  const pontos = dadosEvolucao(meses);

  return (
    <div>
      <figure role="img" aria-label={descreverEvolucao(pontos)} className="m-0">
        <AreaChart responsive width="100%" height={220} data={pontos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`${id}-total`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: COR.eixo, stopOpacity: 0.35 }} />
              <stop offset="100%" style={{ stopColor: COR.eixo, stopOpacity: 0.02 }} />
            </linearGradient>
            <linearGradient id={`${id}-feitas`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: COR.primaria, stopOpacity: 0.55 }} />
              <stop offset="100%" style={{ stopColor: COR.primaria, stopOpacity: 0.04 }} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={COR.grade} strokeDasharray="3 4" />
          <XAxis dataKey="rotulo" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 12, style: { fill: COR.eixo } }} />
          <YAxis width={30} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, style: { fill: COR.eixo } }} />
          <Tooltip
            cursor={{ stroke: COR.grade }}
            content={<DicaGrafico titulo={(linha: PontoEvolucao) => formatarMes(linha.mes)} valor={(v) => `${v} ${v === 1 ? 'tarefa' : 'tarefas'}`} />}
          />
          <Area type="monotone" dataKey="total" name="Tarefas do mês" stroke={COR.eixo} strokeWidth={2} fill={`url(#${id}-total)`} isAnimationActive={animar} animationDuration={900} />
          <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke={COR.primaria} strokeWidth={2.5} fill={`url(#${id}-feitas)`} activeDot={{ r: 5 }} isAnimationActive={animar} animationDuration={900} animationBegin={150} />
        </AreaChart>
      </figure>
      <Legenda
        itens={[
          { rotulo: 'Tarefas do mês', cor: COR.eixo },
          { rotulo: 'Concluídas', cor: COR.primaria },
        ]}
      />
    </div>
  );
}
