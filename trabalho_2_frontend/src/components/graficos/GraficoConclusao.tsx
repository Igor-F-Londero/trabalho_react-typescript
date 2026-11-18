import { useEffect, useRef } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useAnimarGraficos } from '../../hooks/useAnimarGraficos';
import {
  dadosConclusao,
  descreverResumo,
  indiceDoMesEmDestaque,
  type PontoConclusao,
} from '../../lib/graficos';
import { formatarMes, formatarPercentual } from '../../lib/resumoMensal';
import type { MesResumo } from '../../lib/types';
import { COR } from './cores';
import DicaGrafico from './DicaGrafico';
import Legenda from './Legenda';

/** Largura mínima de cada mês: abaixo disso as barras ficariam finas demais e o gráfico rola na horizontal. */
const LARGURA_POR_MES = 58;

/** Rótulo do eixo: o mês e, no mês atual, a palavra "atual" logo abaixo. */
function TickMes({ x, y, payload, pontos }: { x?: number; y?: number; payload?: { value: string }; pontos: PontoConclusao[] }) {
  const atual = pontos.find((p) => p.rotulo === payload?.value)?.atual;
  return (
    <g transform={`translate(${x},${y})`}>
      <text y={16} textAnchor="middle" fontSize={12} fontWeight={atual ? 700 : 500} style={{ fill: atual ? 'var(--color-texto)' : COR.eixo }}>
        {payload?.value}
      </text>
      {atual && (
        <text y={30} textAnchor="middle" fontSize={9} fontWeight={700} letterSpacing=".04em" style={{ fill: COR.primaria, textTransform: 'uppercase' }}>
          atual
        </text>
      )}
    </g>
  );
}

/** Barras agrupadas por mês: "% feito" ao lado de "% por importância". `hoje` só existe para os testes fixarem a data. */
export default function GraficoConclusao({ meses, hoje }: { meses: MesResumo[]; hoje?: Date }) {
  const animar = useAnimarGraficos();
  const rolagemRef = useRef<HTMLElement>(null);
  const pontos = dadosConclusao(meses, hoje);

  // Em telas estreitas os meses rolam na horizontal: ao abrir, centraliza o mês em destaque (a rolagem é só do gráfico).
  useEffect(() => {
    const el = rolagemRef.current;
    if (!el) return;
    const centro = ((indiceDoMesEmDestaque(meses, hoje) + 0.5) / meses.length) * el.scrollWidth;
    el.scrollLeft = Math.min(Math.max(0, centro - el.clientWidth / 2), Math.max(0, el.scrollWidth - el.clientWidth));
    // Só ao montar: depois disso a pessoa rola como quiser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <figure
        ref={rolagemRef}
        role="img"
        aria-label={descreverResumo(meses, hoje)}
        className="m-0 overflow-x-auto [scrollbar-color:var(--color-borda)_transparent] [scrollbar-width:thin]"
      >
        <div style={{ minWidth: meses.length * LARGURA_POR_MES }}>
          <BarChart
            responsive
            width="100%"
            height={270}
            data={pontos}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barGap={3}
            barCategoryGap="22%"
          >
            <CartesianGrid vertical={false} stroke={COR.grade} strokeDasharray="3 4" />
            <XAxis dataKey="rotulo" axisLine={false} tickLine={false} interval={0} height={40} tick={<TickMes pontos={pontos} />} />
            <YAxis
              width={42}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, style: { fill: COR.eixo } }}
            />
            <Tooltip
              cursor={{ fill: COR.destaque, opacity: 0.7, stroke: 'none' }}
              content={<DicaGrafico titulo={(linha: PontoConclusao) => formatarMes(linha.mes)} valor={formatarPercentual} />}
            />
            <Bar dataKey="feito" name="% feito" fill={COR.primariaClara} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={animar} animationDuration={900} />
            <Bar dataKey="importancia" name="% por importância" fill={COR.primaria} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={animar} animationDuration={900} animationBegin={150} />
          </BarChart>
        </div>
      </figure>
      <Legenda
        itens={[
          { rotulo: '% feito', cor: COR.primariaClara },
          { rotulo: '% por importância', cor: COR.primaria },
        ]}
      />
    </div>
  );
}
