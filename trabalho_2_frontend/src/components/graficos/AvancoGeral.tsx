import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { useAnimarGraficos } from '../../hooks/useAnimarGraficos';
import { formatarPercentual } from '../../lib/resumoMensal';
import { COR } from './cores';

const TAMANHO = 150;

interface Props {
  /** Percentual de 0 a 100; valores fora disso são limitados no desenho. */
  valor: number;
  /** Texto curto abaixo do número, dentro do arco. */
  legenda: string;
  /** Descrição completa para leitores de tela (o desenho em si é decorativo). */
  descricao: string;
}

/** Arco de progresso (gráfico radial): o traço "cresce" até o valor quando aparece na tela. */
export default function AvancoGeral({ valor, legenda, descricao }: Props) {
  const animar = useAnimarGraficos();
  const limitado = Math.min(100, Math.max(0, valor));

  return (
    <figure role="img" aria-label={descricao} className="relative m-0 shrink-0" style={{ width: TAMANHO, height: TAMANHO }}>
      <RadialBarChart
        width={TAMANHO}
        height={TAMANHO}
        data={[{ valor: limitado }]}
        innerRadius="76%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
        barSize={14}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
        <RadialBar
          dataKey="valor"
          angleAxisId={0}
          cornerRadius={10}
          fill={COR.primaria}
          background={{ fill: COR.grade, opacity: 0.45 }}
          isAnimationActive={animar}
          animationDuration={1000}
        />
      </RadialBarChart>
      <figcaption aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl leading-none font-bold tabular-nums">{formatarPercentual(valor)}</strong>
        <span className="mt-1 text-[0.7rem] text-suave">{legenda}</span>
      </figcaption>
    </figure>
  );
}
