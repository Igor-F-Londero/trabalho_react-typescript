import { formatarPercentual } from '../lib/resumoMensal';

const RAIO = 52;
/** Comprimento do traço do anel (2πr). Precisa bater com o `from` da animação `anel` no CSS. */
export const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

interface Props {
  /** Percentual de 0 a 100; valores fora disso são limitados no desenho. */
  valor: number;
  /** Texto curto abaixo do número, dentro do anel. */
  legenda: string;
  /** Descrição completa para leitores de tela (o desenho em si é decorativo). */
  descricao: string;
}

/** Anel de progresso animado: o traço "cresce" até o valor quando aparece na tela. */
export default function AnelProgresso({ valor, legenda, descricao }: Props) {
  const preenchido = Math.min(100, Math.max(0, valor)) / 100;

  return (
    <figure className="anel" role="img" aria-label={descricao}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="anel-trilho" cx="60" cy="60" r={RAIO} />
        <circle
          className="anel-valor"
          cx="60"
          cy="60"
          r={RAIO}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - preenchido)}
        />
      </svg>
      <figcaption aria-hidden="true">
        <strong>{formatarPercentual(valor)}</strong>
        <span>{legenda}</span>
      </figcaption>
    </figure>
  );
}
